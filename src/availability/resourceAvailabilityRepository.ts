import { TimeSlot } from '#shared';
import { PostgresRepository, parseDBDate } from '#storage';
import { ObjectSet, UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import pg from 'pg';
import format from 'pg-format';
import { Blockade, Owner, ResourceId } from '.';
import { ResourceAvailability } from './resourceAvailability';
import { ResourceAvailabilityId } from './resourceAvailabilityId';
import { ResourceGroupedAvailability } from './resourceGroupedAvailability';

type ResourceAvailabilityEntity = {
  id: string;
  resource_id: string;
  resource_parent_id: string | undefined;
  version: string;
  from_date: string;
  to_date: string;
  taken_by: string | undefined;
  disabled: boolean;
};

type InsertResourceAvailability = [
  string,
  string,
  string | null,
  UTCDate,
  UTCDate,
  string | null,
  boolean,
  number,
];

type UpdateResourceAvailability = [string, string, boolean, number];

export class ResourceAvailabilityRepository extends PostgresRepository {
  constructor(client?: pg.Client | pg.PoolClient) {
    super(client);
  }

  public saveNew = (
    resourceAvailability: ResourceAvailability,
  ): Promise<void> => this.saveAllNew([resourceAvailability]);

  public saveNewGrouped = (
    groupedAvailability: ResourceGroupedAvailability,
  ): Promise<void> => this.saveAllNew(groupedAvailability.availabilities);

  private saveAllNew = async (
    availabilities: ResourceAvailability[],
  ): Promise<void> => {
    if (availabilities.length === 0) return;

    const params = availabilities.reduce<InsertResourceAvailability[]>(
      (params, ra) => [
        ...params,
        [
          ra.id,
          ra.resourceId,
          ra.resourceParentId,
          ra.segment.from,
          ra.segment.to,
          null,
          false,
          0,
        ],
      ],
      [],
    );

    const sql = format(
      `
    INSERT INTO  availability.availabilities
    (id, resource_id, resource_parent_id, from_date, to_date, taken_by, disabled, version)
    VALUES %L
    `,
      params,
    );

    await this.client.query(sql);
  };

  public loadAllWithinSlot = async (
    resourceId: ResourceId,
    segment: TimeSlot,
  ): Promise<ResourceAvailability[]> => {
    const sql = format(
      `
    select * from availability.availabilities where resource_id = %L
    and from_date >= %L and to_date <= %L
    `,
      resourceId,
      segment.from,
      segment.to,
    );

    const result = await this.client.query<ResourceAvailabilityEntity>(sql);

    return result.rows.map(mapToResourceAvailability);
  };

  public loadAllByParentIdWithinSlot = async (
    parentId: ResourceId,
    segment: TimeSlot,
  ): Promise<ResourceAvailability[]> => {
    const sql = format(
      `
      select * from availability.availabilities where resource_parent_id = %L
      and from_date >= %L and to_date <= %L
    `,
      parentId,
      segment.from.toUTCString(),
      segment.to.toUTCString(),
    );

    const result = await this.client.query<ResourceAvailabilityEntity>(sql);

    return result.rows.map(mapToResourceAvailability);
    return Promise.resolve([]);
  };

  public saveCheckingVersion = (
    resourceAvailability: ResourceAvailability,
  ): Promise<boolean> => {
    return this.saveAllCheckingVersion([resourceAvailability]);
  };

  public saveGroupedCheckingVersion = (
    groupedAvailability: ResourceGroupedAvailability,
  ): Promise<boolean> => {
    return this.saveAllCheckingVersion(groupedAvailability.availabilities);
  };

  public saveAllCheckingVersion = async (
    resourceAvailabilities: ResourceAvailability[],
  ): Promise<boolean> => {
    if (resourceAvailabilities.length === 0) return false;

    const params = resourceAvailabilities.reduce<UpdateResourceAvailability[]>(
      (params, ra) => [
        ...params,
        [
          ra.id.toString(),
          ra.blockedBy().owner?.toString() ?? null,
          ra.isDisabled(),
          ra.version,
        ],
      ],
      [],
    );

    const sql = format(
      `
      UPDATE availability.availabilities AS a
      SET
        taken_by = v.taken_by::uuid,
        disabled = v.disabled::boolean,
        version = v.version::bigint + 1
      FROM (VALUES %L) AS v(id, taken_by, disabled, version)
      WHERE a.id = v.id::uuid AND a.version = v.version::bigint;
      `,
      params,
    );

    const result = await this.client.query(sql);
    return result.rowCount === resourceAvailabilities.length;
  };

  public loadById = async (
    availabilityId: ResourceAvailabilityId,
  ): Promise<ResourceAvailability> => {
    const sql = format(
      `select * from availability.availabilities where id = %L`,
      availabilityId,
    );

    const result = await this.client.query<ResourceAvailabilityEntity>(sql);

    return result.rows.map(mapToResourceAvailability)[0];
  };

  public loadAvailabilitiesOfRandomResourceWithin = async (
    resourceIds: ObjectSet<ResourceAvailabilityId>,
    normalized: TimeSlot,
  ): Promise<ResourceGroupedAvailability> => {
    const sql = format(
      `
      WITH AvailableResources AS (
        SELECT resource_id 
        FROM availability.availabilities
        WHERE resource_id = ANY(%L)
        AND taken_by IS NULL
        AND from_date >= %L
        AND to_date <= %L
        GROUP BY resource_id
      ),
      RandomResource AS (
        SELECT resource_id
        FROM AvailableResources
        RDER BY RANDOM()
        LIMIT 1
      )
      SELECT a.*
      FROM availability.availabilities a
      JOIN RandomResource r ON a.resource_id = r.resource_id
      `,
      resourceIds,
      normalized.from,
      normalized.to,
    );

    const result = await this.client.query<ResourceAvailabilityEntity>(sql);

    return new ResourceGroupedAvailability(
      result.rows.map(mapToResourceAvailability),
    );
  };
}

const mapToResourceAvailability = (
  entity: ResourceAvailabilityEntity,
): ResourceAvailability =>
  new ResourceAvailability(
    ResourceAvailabilityId.from(UUID.from(entity.id)),
    ResourceId.from(UUID.from(entity.resource_id)),
    new TimeSlot(parseDBDate(entity.from_date), parseDBDate(entity.to_date)),
    entity.resource_parent_id
      ? ResourceId.from(UUID.from(entity.resource_parent_id))
      : null,
    new Blockade(
      entity.taken_by ? new Owner(UUID.from(entity.taken_by)) : Owner.none(),
      entity.disabled,
    ),
    Number(entity.version),
  );
