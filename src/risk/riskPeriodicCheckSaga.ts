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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RISK_THRESHOLD_VALUE = Earnings.of(1000);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UPCOMING_DEADLINE_AVAILABILITY_SEARCH = 30;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UPCOMING_DEADLINE_REPLACEMENT_SUGGESTION = 15;

export class RiskPeriodicCheckSaga {
  private _id: RiskPeriodicCheckSagaId;
  private _projectId: ProjectAllocationsId;
  private _missingDemands: Demands | null;
  private _earnings: Earnings | null;
  private _version: number;
  private _deadline: UTCDate | null;

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
    this._id = riskSagaId;
    this._projectId = projectId;

    if (missingDemandsOrEarnings instanceof Demands) {
      this._missingDemands = missingDemandsOrEarnings;
      this._earnings = null;
    } else if ('missingDemands' in missingDemandsOrEarnings) {
      this._missingDemands = missingDemandsOrEarnings.missingDemands;
      this._earnings = missingDemandsOrEarnings.earnings;
    } else {
      this._missingDemands = null;
      this._earnings = missingDemandsOrEarnings;
    }
    this._id = riskSagaId;
    this._deadline = deadline;
    this._version = version;
  }
  areDemandsSatisfied = (): boolean => this._missingDemands?.all.length === 0;

  public handle = (
    _event: RiskPeriodicCheckSagaEvent,
  ): RiskPeriodicCheckSagaStep => {
    return null!;
  };

  public handleWeeklyCheck = (_when: UTCDate): RiskPeriodicCheckSagaStep => {
    return null!;
  };

  public get id() {
    return this._id;
  }
  public get projectId() {
    return this._projectId;
  }
  public get missingDemands() {
    return this._missingDemands;
  }
  public get earnings() {
    return this._earnings;
  }
  public get deadline() {
    return this._deadline;
  }
  public get version() {
    return this._version;
  }
}
