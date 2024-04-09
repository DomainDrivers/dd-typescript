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
  #id: RiskPeriodicCheckSagaId;
  #projectId: ProjectAllocationsId;
  #missingDemands: Demands | null;
  #earnings: Earnings | null;
  #version: number;
  #deadline: UTCDate | null;

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
    this.#id = riskSagaId;
    this.#projectId = projectId;

    if (!missingDemandsOrEarnings) {
      this.#missingDemands = Demands.none();
      this.#earnings = null;
    } else if (missingDemandsOrEarnings instanceof Demands) {
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

  areDemandsSatisfied = (): boolean => this.#missingDemands?.all.length === 0;

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
        this.#earnings = event.earnings;
        return 'DO_NOTHING';
      }
      case 'ProjectAllocationScheduled': {
        this.#deadline = event.fromTo.to;
        return 'DO_NOTHING';
      }
      case 'ResourceTakenOver': {
        if (this.#deadline && isAfter(event.occurredAt, this.#deadline)) {
          return 'DO_NOTHING';
        }
        return 'NOTIFY_ABOUT_POSSIBLE_RISK';
      }
    }
  };

  public handleWeeklyCheck = (when: UTCDate): RiskPeriodicCheckSagaStep => {
    if (this.#deadline == null || isAfter(when, this.#deadline)) {
      return 'DO_NOTHING';
    }
    if (this.areDemandsSatisfied()) {
      return 'DO_NOTHING';
    }
    const daysToDeadline =
      Duration.between(when, this.#deadline) / Duration.day;
    if (daysToDeadline > UPCOMING_DEADLINE_AVAILABILITY_SEARCH) {
      return 'DO_NOTHING';
    }
    if (daysToDeadline > UPCOMING_DEADLINE_REPLACEMENT_SUGGESTION) {
      return 'FIND_AVAILABLE';
    }
    if (this.#earnings != null && this.#earnings > RISK_THRESHOLD_VALUE) {
      return 'SUGGEST_REPLACEMENT';
    }
    return 'DO_NOTHING';
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
