import {
  Demands,
  Earnings,
  ProjectAllocationsId,
  type CapabilitiesAllocated,
  type CapabilityReleased,
  type EarningsRecalculated,
  type ProjectAllocationScheduled,
  type ProjectAllocationsDemandsScheduled,
} from '#allocation';

import type { UTCDate } from '@date-fns/utc';
import { RiskPeriodicCheckSagaId, type RiskPeriodicCheckSagaStep } from '.';
import type { ResourceTakenOver } from '../availability';

export type RiskPeriodicCheckSagaEvent =
  | EarningsRecalculated
  | ProjectAllocationsDemandsScheduled
  | ProjectAllocationScheduled
  | CapabilitiesAllocated
  | ResourceTakenOver
  | CapabilityReleased;

export class RiskPeriodicCheckSaga {
  static readonly RISK_THRESHOLD_VALUE = Earnings.of(1000);
  static readonly UPCOMING_DEADLINE_AVAILABILITY_SEARCH = 30;
  static readonly UPCOMING_DEADLINE_REPLACEMENT_SUGGESTION = 15;

  #id: RiskPeriodicCheckSagaId;
  #projectId: ProjectAllocationsId;
  #missingDemands: Demands | null;
  #earnings: Earnings | null;
  #version: number;
  #deadline: UTCDate | null;

  constructor(
    projectId: ProjectAllocationsId,
    missingDemandsOrEarnings:
      | Demands
      | Earnings
      | { missingDemands: Demands | null; earnings: Earnings | null },
    riskSagaId: RiskPeriodicCheckSagaId = RiskPeriodicCheckSagaId.newOne(),
    deadline: UTCDate | null = null,
    version: number = 0,
  ) {
    this.#id = riskSagaId;
    this.#projectId = projectId;

    if (missingDemandsOrEarnings instanceof Demands) {
      this.#missingDemands = missingDemandsOrEarnings;
      this.#earnings = null;
    } else if ('missingDemands' in missingDemandsOrEarnings) {
      this.#missingDemands = missingDemandsOrEarnings.missingDemands;
      this.#earnings = missingDemandsOrEarnings.earnings;
    } else {
      this.#missingDemands = null;
      this.#earnings = missingDemandsOrEarnings;
    }
    this.#id = riskSagaId;
    this.#deadline = deadline;
    this.#version = version;
  }
  areDemandsSatisfied = (): boolean => false;

  public handle = (
    _event: RiskPeriodicCheckSagaEvent,
  ): RiskPeriodicCheckSagaStep => {
    return null!;
  };

  public handleWeeklyCheck = (_when: UTCDate): RiskPeriodicCheckSagaStep => {
    return null!;
  };

  public get id() {
    return this.#id;
  }
  public get projectId() {
    return this.#projectId;
  }
  public get missingDemands() {
    return this.#missingDemands;
  }
  public get earnings() {
    return this.#earnings;
  }
  public get deadline() {
    return this.#deadline;
  }
  public get version() {
    return this.#version;
  }
}
