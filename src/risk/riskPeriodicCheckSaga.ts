import {
  Demands,
  Earnings,
  ProjectAllocationsId,
  type EarningsRecalculated,
  type ProjectAllocationScheduled,
} from '#allocation';

import type { UTCDate } from '@date-fns/utc';
import { isAfter } from 'date-fns';
import { RiskPeriodicCheckSagaId, type RiskPeriodicCheckSagaStep } from '.';
import type { ResourceTakenOver } from '../availability';
import { Duration } from '../utils';

export type RiskPeriodicCheckSagaEvent =
  | EarningsRecalculated
  | ProjectAllocationScheduled
  | ResourceTakenOver;

const RISK_THRESHOLD_VALUE = Earnings.of(1000);
const UPCOMING_DEADLINE_AVAILABILITY_SEARCH = 30;
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
    missingDemandsOrEarnings?:
      | Demands
      | Earnings
      | { missingDemands: Demands | null; earnings: Earnings | null },
    riskSagaId: RiskPeriodicCheckSagaId = RiskPeriodicCheckSagaId.newOne(),
    deadline: UTCDate | null = null,
    version: number = 0,
  ) {
    this._id = riskSagaId;
    this._projectId = projectId;

    if (!missingDemandsOrEarnings) {
      this._missingDemands = Demands.none();
      this._earnings = null;
    } else if (missingDemandsOrEarnings instanceof Demands) {
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

  public setMissingDemands(
    _missingDemands: Demands,
  ): RiskPeriodicCheckSagaStep {
    //TODO implement
    return null!;
  }

  public handle = ({
    type,
    data: event,
  }: RiskPeriodicCheckSagaEvent): RiskPeriodicCheckSagaStep => {
    switch (type) {
      case 'EarningsRecalculated': {
        this._earnings = event.earnings;
        return 'DO_NOTHING';
      }
      case 'ProjectAllocationScheduled': {
        this._deadline = event.fromTo.to;
        return 'DO_NOTHING';
      }
      case 'ResourceTakenOver': {
        if (this._deadline && isAfter(event.occurredAt, this._deadline)) {
          return 'DO_NOTHING';
        }
        return 'NOTIFY_ABOUT_POSSIBLE_RISK';
      }
    }
  };

  public handleWeeklyCheck = (when: UTCDate): RiskPeriodicCheckSagaStep => {
    if (this._deadline == null || isAfter(when, this._deadline)) {
      return 'DO_NOTHING';
    }
    if (this.areDemandsSatisfied()) {
      return 'DO_NOTHING';
    }
    const daysToDeadline =
      Duration.between(when, this._deadline) / Duration.day;
    if (daysToDeadline > UPCOMING_DEADLINE_AVAILABILITY_SEARCH) {
      return 'DO_NOTHING';
    }
    if (daysToDeadline > UPCOMING_DEADLINE_REPLACEMENT_SUGGESTION) {
      return 'FIND_AVAILABLE';
    }
    if (this._earnings != null && this._earnings > RISK_THRESHOLD_VALUE) {
      return 'SUGGEST_REPLACEMENT';
    }
    return 'DO_NOTHING';
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
