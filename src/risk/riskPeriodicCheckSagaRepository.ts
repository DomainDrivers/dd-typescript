import { Demand, Demands, Earnings, ProjectAllocationsId } from '#allocation';
import { Capability, TimeSlot } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { eq, inArray } from 'drizzle-orm';
import { RiskPeriodicCheckSaga, RiskPeriodicCheckSagaId } from '.';
import * as schema from './schema';

export interface RiskPeriodicCheckSagaRepository
  extends Repository<RiskPeriodicCheckSaga, RiskPeriodicCheckSagaId> {
  findByProjectId(
    projectId: ProjectAllocationsId,
  ): Promise<RiskPeriodicCheckSaga | null>;

  findByProjectIdIn(
    interested: ProjectAllocationsId[],
  ): Promise<RiskPeriodicCheckSaga[]>;

  findAll(): Promise<RiskPeriodicCheckSaga[]>;
}

export class DrizzleRiskPeriodicCheckSagaRepository
  extends DrizzleRepository<
    RiskPeriodicCheckSaga,
    RiskPeriodicCheckSagaId,
    typeof schema
  >
  implements RiskPeriodicCheckSagaRepository
{
  constructor() {
    super(schema.projectRiskSagas, schema.projectRiskSagas.id);
  }

  public findById = async (
    id: RiskPeriodicCheckSagaId,
  ): Promise<RiskPeriodicCheckSaga | null> => {
    const result = await this.db.query.projectRiskSagas.findFirst({
      where: eq(schema.projectRiskSagas.id, id),
    });

    return result ? mapToRiskPeriodicCheckSaga(result) : null;
  };

  public findByProjectId = async (
    projectId: ProjectAllocationsId,
  ): Promise<RiskPeriodicCheckSaga | null> => {
    const result = await this.db.query.projectRiskSagas.findFirst({
      where: eq(schema.projectRiskSagas.projectAllocationsId, projectId),
    });

    return result ? mapToRiskPeriodicCheckSaga(result) : null;
  };

  public findByProjectIdIn = async (
    interested: ProjectAllocationsId[],
  ): Promise<RiskPeriodicCheckSaga[]> => {
    const result = await this.db
      .select()
      .from(schema.projectRiskSagas)
      .where(inArray(schema.projectRiskSagas.id, interested));

    return result.map(mapToRiskPeriodicCheckSaga);
  };

  public findAll = async (): Promise<RiskPeriodicCheckSaga[]> => {
    const result = await this.db.select().from(schema.projectRiskSagas);

    return result.map(mapToRiskPeriodicCheckSaga);
  };

  public save = async (
    riskPeriodicCheckSaga: RiskPeriodicCheckSaga,
  ): Promise<void> => {
    const entity = mapFromRiskPeriodicCheckSaga(riskPeriodicCheckSaga);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: riskPeriodicCheckSaga.id,
    });
  };
}

const mapToRiskPeriodicCheckSaga = (
  entity: schema.RiskPeriodicCheckSagaEntity,
): RiskPeriodicCheckSaga =>
  new RiskPeriodicCheckSaga(
    ProjectAllocationsId.from(UUID.from(entity.projectAllocationsId)),
    mapToMissingDemandsOrEarnings(entity),
    RiskPeriodicCheckSagaId.from(UUID.from(entity.id)),
    entity.deadline ? new UTCDate(entity.deadline) : null,
    entity.version,
  );

const mapToMissingDemandsOrEarnings = (
  entity: schema.RiskPeriodicCheckSagaEntity,
): { missingDemands: Demands | null; earnings: Earnings | null } => {
  return {
    missingDemands: entity.missingDemands
      ? mapToDemands(entity.missingDemands)
      : null,
    earnings: entity.earnings ? Earnings.of(entity.earnings) : null,
  };
};

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

const mapFromRiskPeriodicCheckSaga = (
  riskPeriodicCheckSaga: RiskPeriodicCheckSaga,
): schema.RiskPeriodicCheckSagaEntity => {
  return {
    id: riskPeriodicCheckSaga.id,
    missingDemands: riskPeriodicCheckSaga.missingDemands
      ? mapFromDemands(riskPeriodicCheckSaga.missingDemands)
      : null,
    earnings: riskPeriodicCheckSaga.earnings?.toNumber() ?? null,
    deadline: riskPeriodicCheckSaga.deadline,
    projectAllocationsId: riskPeriodicCheckSaga.projectId,
    version: riskPeriodicCheckSaga.version,
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
