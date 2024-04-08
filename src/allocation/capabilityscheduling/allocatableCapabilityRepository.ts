import { Capability, TimeSlot } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { ObjectSet, UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { parseJSON } from 'date-fns';
import { eq, inArray, sql } from 'drizzle-orm';
import {
  AllocatableCapability,
  AllocatableCapabilityId,
  AllocatableResourceId,
  CapabilitySelector,
} from '.';
import { SelectingPolicy } from './capabilitySelector';
import * as schema from './schema';

const resourceIdColumn = schema.capabilityAllocatableCapabilities.resourceId;
const fromColumn = schema.capabilityAllocatableCapabilities.fromDate;
const toColumn = schema.capabilityAllocatableCapabilities.toDate;

type RawQueryType = Omit<
  schema.AllocatableCapabilityEntity,
  'fromDate' | 'toDate'
> & { fromDate: string; toDate: string };

export interface AllocatableCapabilityRepository
  extends Repository<AllocatableCapability, AllocatableCapabilityId> {
  findAllById(ids: AllocatableCapabilityId[]): Promise<AllocatableCapability[]>;

  findByCapabilityWithin(
    name: string,
    type: string,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability[]>;

  findByResourceIdAndTimeSlot(
    allocatableResourceId: UUID,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability[]>;

  findByResourceIdAndCapabilityAndTimeSlot(
    allocatableResourceId: UUID,
    name: string,
    type: string,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability | null>;

  saveAll(allocatedCapabilities: AllocatableCapability[]): Promise<void>;
}

export class DrizzleAllocatableCapabilityRepository
  extends DrizzleRepository<
    AllocatableCapability,
    AllocatableCapabilityId,
    typeof schema
  >
  implements AllocatableCapabilityRepository
{
  constructor() {
    super(
      schema.capabilityAllocatableCapabilities,
      schema.capabilityAllocatableCapabilities.id,
    );
  }

  public findById = async (
    id: AllocatableCapabilityId,
  ): Promise<AllocatableCapability | null> => {
    const result =
      await this.db.query.capabilityAllocatableCapabilities.findFirst({
        where: eq(schema.capabilityAllocatableCapabilities.id, id),
      });

    return result ? mapToAllocatableCapability(result) : null;
  };
  public findAllById = async (
    ids: AllocatableCapabilityId[],
  ): Promise<AllocatableCapability[]> => {
    const result = await this.db
      .select()
      .from(schema.capabilityAllocatableCapabilities)
      .where(inArray(schema.capabilityAllocatableCapabilities.id, ids));

    return result.map(mapToAllocatableCapability);
  };

  public findByCapabilityWithin = async (
    name: string,
    type: string,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability[]> => {
    const result = await this.db.execute<RawQueryType>(
      sql`
      SELECT ac.id, ac.resource_id as "resourceId", ac.possible_capabilities as "possibleCapabilities", from_date as "fromDate", to_date as "toDate"
      FROM "capability-scheduling"."cap_allocatable_capabilities" AS ac
      CROSS JOIN LATERAL jsonb_array_elements(ac.possible_capabilities -> 'capabilities') AS o(obj)
      WHERE o.obj ->> 'name' = ${name} AND o.obj ->> 'type' = ${type} AND ac.from_date <= ${from} and ac.to_date >= ${to}
    `,
    );

    return result.rows.map(mapToAllocatableCapability);
  };

  public findByResourceIdAndCapabilityAndTimeSlot = async (
    allocatableResourceId: UUID,
    name: string,
    type: string,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability | null> => {
    const result = await this.db.execute<RawQueryType>(
      sql`
      SELECT ac.id, ac.resource_id as "resourceId", ac.possible_capabilities as "possibleCapabilities", from_date as "fromDate", to_date as "toDate"
      FROM "capability-scheduling"."cap_allocatable_capabilities" AS ac
      CROSS JOIN LATERAL jsonb_array_elements(ac.possible_capabilities -> 'capabilities') AS o(obj)
      WHERE ac.resource_id = ${allocatableResourceId} AND o.obj ->> 'name' = ${name} AND o.obj ->> 'type' = ${type} AND ac.from_date = ${from} and ac.to_date = ${to}
    `,
    );

    return result.rowCount === 1
      ? result.rows.map(mapToAllocatableCapability)[0]
      : null;
  };

  public findByResourceIdAndTimeSlot = async (
    allocatableResourceId: UUID,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability[]> => {
    const result = await this.db
      .select()
      .from(schema.capabilityAllocatableCapabilities)
      .where(
        sql`${resourceIdColumn} = ${allocatableResourceId} AND ${fromColumn} <= ${from} and ${toColumn} >= ${to}`,
      );

    return result.map(mapToAllocatableCapability);
  };

  public saveAll = async (
    allocatedCapabilities: AllocatableCapability[],
  ): Promise<void> => {
    for (const allocatedCapability of allocatedCapabilities) {
      await this.save(allocatedCapability);
    }
  };

  public save = async (
    allocatableCapability: AllocatableCapability,
  ): Promise<void> => {
    const entity = mapFromAllocatableCapability(allocatableCapability);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: allocatableCapability.id,
    });
  };
}

const mapToAllocatableCapability = (
  entity: schema.AllocatableCapabilityEntity | RawQueryType,
): AllocatableCapability =>
  new AllocatableCapability(
    AllocatableResourceId.from(UUID.from(entity.resourceId)),
    mapToCapabilitySelector(entity.possibleCapabilities),
    new TimeSlot(
      new UTCDate(
        typeof entity.fromDate === 'string'
          ? parseJSON(entity.fromDate)
          : entity.fromDate,
      ),
      new UTCDate(
        typeof entity.toDate === 'string'
          ? parseJSON(entity.toDate)
          : entity.toDate,
      ),
    ),
    AllocatableCapabilityId.from(UUID.from(entity.id)),
  );

const mapToCapabilitySelector = (
  entity: schema.CapabilitySelectorEntity,
): CapabilitySelector =>
  new CapabilitySelector(
    ObjectSet.from(entity.capabilities.map(mapToCapability)),
    SelectingPolicy.from(entity.selectingPolicy),
  );

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapFromAllocatableCapability = (
  allocatedCapability: AllocatableCapability,
): schema.AllocatableCapabilityEntity => {
  return {
    id: allocatedCapability.id,
    possibleCapabilities: mapFromCapabilitySelector(
      allocatedCapability.capabilities,
    ),
    resourceId: allocatedCapability.resourceId,
    fromDate: allocatedCapability.slot.from,
    toDate: allocatedCapability.slot.to,
  };
};

const mapFromCapabilitySelector = (
  capabilitySelector: CapabilitySelector,
): schema.CapabilitySelectorEntity => {
  return {
    capabilities: capabilitySelector.capabilities.map(mapFromCapability),
    selectingPolicy: capabilitySelector.selectingPolicy,
  };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};
