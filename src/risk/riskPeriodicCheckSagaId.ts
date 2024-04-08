import { UUID } from '#utils';

export type RiskPeriodicCheckSagaId = UUID<'RiskPeriodicCheckSagaId'>;

export const RiskPeriodicCheckSagaId = {
  newOne: (): RiskPeriodicCheckSagaId =>
    UUID.randomUUID() as RiskPeriodicCheckSagaId,

  from: (key: UUID): RiskPeriodicCheckSagaId => key as RiskPeriodicCheckSagaId,
};
