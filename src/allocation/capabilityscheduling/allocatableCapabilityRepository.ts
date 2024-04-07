import { Capability, TimeSlot } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { eq, inArray, sql } from 'drizzle-orm';
import {
  AllocatableCapability,
  AllocatableCapabilityId,
  AllocatableResourceId,
} from '.';
import * as schema from './schema';

export interface AllocatableCapabilityRepository
  extends Repository<AllocatableCapability, AllocatableCapabilityId> {
  findByCapabilityWithin(
    name: string,
    type: string,
    from: UTCDate,
    to: UTCDate,
  ): Promise<AllocatableCapability[]>;
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
    const capabilityColumn =
      schema.capabilityAllocatableCapabilities.capability;
    const fromColumn = schema.capabilityAllocatableCapabilities.fromDate;
    const toColumn = schema.capabilityAllocatableCapabilities.toDate;

    const result = await this.db
      .select()
      .from(schema.capabilityAllocatableCapabilities)
      .where(
        sql`${capabilityColumn} ->> 'name' = ${name} AND ${capabilityColumn} ->> 'type' = ${type} AND ${fromColumn} <= ${from} and ${toColumn} >= ${to}`,
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
      id: [
        schema.capabilityAllocatableCapabilities.id,
        allocatableCapability.id,
      ],
    });
  };
}

const mapToAllocatableCapability = (
  entity: schema.AllocatableCapabilityEntity,
): AllocatableCapability =>
  new AllocatableCapability(
    AllocatableResourceId.from(UUID.from(entity.resourceId)),
    mapToCapability(entity.capability),
    new TimeSlot(new UTCDate(entity.fromDate), new UTCDate(entity.toDate)),
    AllocatableCapabilityId.from(UUID.from(entity.id)),
  );

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapFromAllocatableCapability = (
  allocatedCapability: AllocatableCapability,
): schema.AllocatableCapabilityEntity => {
  return {
    id: allocatedCapability.id,
    capability: mapFromCapability(allocatedCapability.capability),
    resourceId: allocatedCapability.resourceId,
    fromDate: allocatedCapability.slot.from,
    toDate: allocatedCapability.slot.to,
  };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};
