import {
  AllocatableCapabilityId,
  Demand,
  Demands,
  Earnings,
  ProjectAllocationsId,
  type EarningsRecalculated,
  type ProjectAllocationScheduled,
} from '#allocation';
import { Owner, type ResourceTakenOver } from '#availability';
import { RiskPeriodicCheckSaga } from '#risk';
import { Capability, TimeSlot } from '#shared';
import { Clock, ObjectSet, event } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { addDays, addHours, subDays, subHours } from 'date-fns';
import { describe, it } from 'node:test';
import { assertEquals } from '../asserts';

const skill = Capability.skill;

void describe('RiskPeriodicCheckSaga', () => {
  const clock = Clock.fixed(new UTCDate());
  const JAVA = skill('JAVA');
  const ONE_DAY = TimeSlot.createDailyTimeSlotAtUTC(2022, 1, 1);
  const SINGLE_DEMAND = Demands.of(new Demand(JAVA, ONE_DAY));
  const MANY_DEMANDS = Demands.of(
    new Demand(JAVA, ONE_DAY),
    new Demand(JAVA, ONE_DAY),
  );
  const PROJECT_DATES = new TimeSlot(
    new UTCDate('2021-01-01T00:00:00.00Z'),
    new UTCDate('2021-01-05T00:00:00.00Z'),
  );
  const PROJECT_ID = ProjectAllocationsId.newOne();
  const CAPABILITY_ID = AllocatableCapabilityId.newOne();

  void it('Updates initial demands on saga creation', () => {
    //when
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);

    //then
    assertEquals(SINGLE_DEMAND, saga.missingDemands);
  });

  void it('Updates deadline on deadline set', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //then
    assertEquals(PROJECT_DATES.to, saga.deadline);
  });

  void it('update missing demands', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);

    //when
    const nextStep = saga.setMissingDemands(MANY_DEMANDS);

    //then
    assertEquals('DO_NOTHING', nextStep);
    assertEquals(MANY_DEMANDS, saga.missingDemands);
  });

  void it('No new steps on when missing demands', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);

    //when
    const nextStep = saga.setMissingDemands(MANY_DEMANDS);

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Updated earnings on earnings recalculated', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);

    //when
    let nextStep = saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    assertEquals('DO_NOTHING', nextStep);

    //then
    assertEquals(Earnings.of(1000), saga.earnings);

    //when
    nextStep = saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(900) },
        clock,
      ),
    );

    //then
    assertEquals(Earnings.of(900), saga.earnings);
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Informs about demands satisfied when no missing demands', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    //when
    const stillMissing = saga.setMissingDemands(SINGLE_DEMAND);
    const zeroDemands = saga.setMissingDemands(Demands.none());

    //then
    assertEquals('DO_NOTHING', stillMissing);
    assertEquals('NOTIFY_ABOUT_DEMANDS_SATISFIED', zeroDemands);
  });

  void it('Do nothing on resource taken over when after deadline', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const afterDeadline = addHours(PROJECT_DATES.to, 100);
    const nextStep = saga.handle(
      event<ResourceTakenOver>(
        'ResourceTakenOver',
        {
          resourceId:
            AllocatableCapabilityId.toAvailabilityResourceId(CAPABILITY_ID),
          previousOwners: ObjectSet.of(Owner.of(PROJECT_ID)),
          slot: ONE_DAY,
          occurredAt: afterDeadline,
        },
        clock,
      ),
    );

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Notify about risk on resource taken over when before deadline', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const beforeDeadline = subHours(PROJECT_DATES.to, 100);
    const nextStep = saga.handle(
      event<ResourceTakenOver>(
        'ResourceTakenOver',
        {
          resourceId:
            AllocatableCapabilityId.toAvailabilityResourceId(CAPABILITY_ID),
          previousOwners: ObjectSet.of(Owner.of(PROJECT_ID)),
          slot: ONE_DAY,
          occurredAt: beforeDeadline,
        },
        clock,
      ),
    );

    //then
    assertEquals('NOTIFY_ABOUT_POSSIBLE_RISK', nextStep);
  });

  void it('No next step on capability released', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);

    //when
    const nextStep = saga.setMissingDemands(SINGLE_DEMAND);

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Weekly check should result in nothing when all demands satisfied', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    //and
    saga.setMissingDemands(Demands.none());
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const wayBeforeDeadline = subDays(PROJECT_DATES.to, 1);
    const nextStep = saga.handleWeeklyCheck(wayBeforeDeadline);

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Weekly check should result in nothing when after deadline', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const wayAfterDeadline = addDays(PROJECT_DATES.to, 300);
    const nextStep = saga.handleWeeklyCheck(wayAfterDeadline);

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Weekly check does nothing when no deadline', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);

    //when
    const nextStep = saga.handleWeeklyCheck(clock.now());

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Weekly check should result in nothing when not close to deadline and demands not satisfied', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, SINGLE_DEMAND);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const wayBeforeDeadline = subDays(PROJECT_DATES.to, 300);
    const nextStep = saga.handleWeeklyCheck(wayBeforeDeadline);

    //then
    assertEquals('DO_NOTHING', nextStep);
  });

  void it('Weekly check should result in find available when close to deadline and demands not satisfied', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(1000) },
        clock,
      ),
    );
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const closeToDeadline = subDays(PROJECT_DATES.to, 20);
    const nextStep = saga.handleWeeklyCheck(closeToDeadline);

    //then
    assertEquals('FIND_AVAILABLE', nextStep);
  });

  void it('Weekly check should result in replacement suggesting when high value project really close to deadline and demands not satisfied', () => {
    //given
    const saga = new RiskPeriodicCheckSaga(PROJECT_ID, MANY_DEMANDS);
    //and
    saga.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId: PROJECT_ID, earnings: Earnings.of(10000) },
        clock,
      ),
    );
    //and
    saga.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: PROJECT_ID, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    const reallyCloseToDeadline = subDays(PROJECT_DATES.to, 2);
    const nextStep = saga.handleWeeklyCheck(reallyCloseToDeadline);

    //then
    assertEquals('SUGGEST_REPLACEMENT', nextStep);
  });
});
