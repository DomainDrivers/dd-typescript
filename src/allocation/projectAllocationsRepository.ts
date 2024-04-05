import { Capability, TimeSlot } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { ObjectSet, UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { eq, inArray } from 'drizzle-orm';
import {
  AllocatedCapability,
  Allocations,
  Demand,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
  ResourceId,
} from '.';
import * as schema from './schema';

export interface ProjectAllocationsRepository
  extends Repository<ProjectAllocations, ProjectAllocationsId> {
  findAll(): Promise<ProjectAllocations[]>;
}

export class DrizzleProjectAllocationsRepository
  extends DrizzleRepository<
    ProjectAllocations,
    ProjectAllocationsId,
    typeof schema
  >
  implements ProjectAllocationsRepository
{
  public findById = async (
    id: ProjectAllocationsId,
  ): Promise<ProjectAllocations | null> => {
    const result = await this.db.query.projectAllocations.findFirst({
      where: eq(schema.projectAllocations.id, id),
    });

    return result ? mapToProjectAllocations(result) : null;
  };
  public findAllById = async (
    ids: ProjectAllocationsId[],
  ): Promise<ProjectAllocations[]> => {
    const result = await this.db
      .select()
      .from(schema.projectAllocations)
      .where(inArray(schema.projectAllocations.id, ids));

    return result.map(mapToProjectAllocations);
  };

  public findAll = async (): Promise<ProjectAllocations[]> => {
    const result = await this.db.select().from(schema.projectAllocations);

    return result.map(mapToProjectAllocations);
  };

  public save = async (
    projectAllocations: ProjectAllocations,
  ): Promise<void> => {
    const entity = mapFromProjectAllocations(projectAllocations);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: [schema.projectAllocations.id, projectAllocations.id],
    });
  };
}

const mapToProjectAllocations = (
  entity: schema.ProjectAllocationsEntity,
): ProjectAllocations =>
  new ProjectAllocations(
    ProjectAllocationsId.from(UUID.from(entity.id)),
    mapToAllocations(entity.allocations),
    mapToDemands(entity.demands),
    mapToTimeSlot({ from: entity.fromDate, to: entity.toDate }),
  );

const mapToAllocations = (entity: schema.AllocationsEntity): Allocations =>
  new Allocations(ObjectSet.from(entity.all.map(mapToAllocatedCapability)));

const mapToAllocatedCapability = (
  entity: schema.AllocatedCapabilityEntity,
): AllocatedCapability =>
  new AllocatedCapability(
    ResourceId.from(UUID.from(entity.resourceId)),
    mapToCapability(entity.capability),
    mapToTimeSlot(entity.timeSlot),
    UUID.from(entity.allocatedCapabilityID),
  );

const mapToDemands = (demands: schema.DemandsEntity | null): Demands =>
  new Demands(demands ? demands.all.map(mapToDemand) : []);

const mapToDemand = ({
  capability,
  slot: timeSlot,
}: schema.DemandEntity): Demand =>
  new Demand(mapToCapability(capability), mapToTimeSlot(timeSlot));

const mapToTimeSlot = ({
  from,
  to,
}: schema.TimeSlotEntity | { from: Date | null; to: Date | null }): TimeSlot =>
  from !== null && to !== null
    ? new TimeSlot(new UTCDate(from), new UTCDate(to))
    : TimeSlot.empty();

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapFromProjectAllocations = (
  projectAllocations: ProjectAllocations,
): schema.ProjectAllocationsEntity => {
  return {
    id: projectAllocations.id,
    allocations: mapFromAllocations(projectAllocations.allocations),
    demands: mapFromDemands(projectAllocations.demands),
    fromDate: projectAllocations.hasTimeSlot()
      ? projectAllocations.timeSlot.from
      : null,
    toDate: projectAllocations.hasTimeSlot()
      ? projectAllocations.timeSlot.to
      : null,
  };
};

const mapFromAllocations = (
  allocations: Allocations,
): schema.AllocationsEntity => {
  return { all: allocations.all.map(mapFromAllocatedCapability) };
};

const mapFromAllocatedCapability = (
  allocatedCapability: AllocatedCapability,
): schema.AllocatedCapabilityEntity => {
  return {
    allocatedCapabilityID: allocatedCapability.allocatedCapabilityID,
    resourceId: allocatedCapability.resourceId,
    capability: mapFromCapability(allocatedCapability.capability),
    timeSlot: mapFromTimeSlot(allocatedCapability.timeSlot),
  };
};

const mapFromDemands = (demands: Demands): schema.DemandsEntity => {
  return {
    all: demands.all.map(mapFromDemand),
  };
};

const mapFromDemand = (demand: Demand): schema.DemandEntity => {
  return {
    capability: mapFromCapability(demand.capability),
    slot: mapFromTimeSlot(demand.slot),
  };
};

const mapFromTimeSlot = (timeSlot: TimeSlot): schema.TimeSlotEntity => {
  return { from: timeSlot.from.toJSON(), to: timeSlot.to.toJSON() };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};
