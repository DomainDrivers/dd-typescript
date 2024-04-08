/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatableCapabilityId,
  AllocatedCapability,
  Allocations,
  CapabilitySelector,
  Demand,
  Demands,
  Earnings,
  PotentialTransfers,
  PotentialTransfersService,
  ProjectAllocationsId,
  ProjectsAllocationsSummary,
} from '#allocation';
import { OptimizationFacade } from '#optimization';
import { Capability, TimeSlot } from '#shared';
import { SimulationFacade } from '#simulation';
import { ObjectMap } from '#utils';
import BigNumber from 'bignumber.js';
import { addMinutes } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
const skill = Capability.skill;
const canJustPerform = CapabilitySelector.canJustPerform;

describe('PotentialTransferScenarios', () => {
  const JAN_1 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const FIFTEEN_MINUTES_IN_JAN = new TimeSlot(
    JAN_1.from,
    addMinutes(JAN_1.from, 15),
  );
  const DEMAND_FOR_JAVA_JUST_FOR_15MIN_IN_JAN = new Demands([
    new Demand(skill('JAVA-MID'), FIFTEEN_MINUTES_IN_JAN),
  ]);
  const DEMAND_FOR_JAVA_MID_IN_JAN = new Demands([
    new Demand(skill('JAVA-MID'), JAN_1),
  ]);
  const DEMANDS_FOR_JAVA_AND_PYTHON_IN_JAN = new Demands([
    new Demand(skill('JAVA-MID'), JAN_1),
    new Demand(skill('PYTHON-MID'), JAN_1),
  ]);

  const BANKING_SOFT_ID = ProjectAllocationsId.newOne();
  const INSURANCE_SOFT_ID = ProjectAllocationsId.newOne();
  const STASZEK_JAVA_MID = new AllocatedCapability(
    AllocatableCapabilityId.newOne(),
    canJustPerform(skill('JAVA-MID')),
    JAN_1,
  );

  const potentialTransfers = new PotentialTransfersService(
    new SimulationFacade(new OptimizationFacade()),
    null!,
    null!,
  );

  it('simulates moving capabilities to different project', () => {
    //given
    const bankingSoft = new Project(
      BANKING_SOFT_ID,
      DEMAND_FOR_JAVA_MID_IN_JAN,
      Earnings.of(9),
    );
    const insuranceSoft = new Project(
      INSURANCE_SOFT_ID,
      DEMAND_FOR_JAVA_MID_IN_JAN,
      Earnings.of(90),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);
    const projects = toPotentialTransfers(bankingSoft, insuranceSoft);

    //when
    const result: BigNumber = potentialTransfers.checkPotentialTransfer(
      projects,
      BANKING_SOFT_ID,
      INSURANCE_SOFT_ID,
      STASZEK_JAVA_MID,
      JAN_1,
    );

    //then
    assert.ok(result.eq(81));
  });

  it('simulates moving capabilities to different project just for awhile', () => {
    //given
    const bankingSoft = new Project(
      BANKING_SOFT_ID,
      DEMAND_FOR_JAVA_MID_IN_JAN,
      Earnings.of(9),
    );
    const insuranceSoft = new Project(
      INSURANCE_SOFT_ID,
      DEMAND_FOR_JAVA_JUST_FOR_15MIN_IN_JAN,
      Earnings.of(99),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);
    const projects = toPotentialTransfers(bankingSoft, insuranceSoft);

    //when
    const result: BigNumber = potentialTransfers.checkPotentialTransfer(
      projects,
      BANKING_SOFT_ID,
      INSURANCE_SOFT_ID,
      STASZEK_JAVA_MID,
      FIFTEEN_MINUTES_IN_JAN,
    );

    //then
    assert.ok(result.eq(90));
  });

  it('the move gives zero profit when there are still missing demands', () => {
    //given
    const bankingSoft = new Project(
      BANKING_SOFT_ID,
      DEMAND_FOR_JAVA_MID_IN_JAN,
      Earnings.of(9),
    );
    const insuranceSoft = new Project(
      INSURANCE_SOFT_ID,
      DEMANDS_FOR_JAVA_AND_PYTHON_IN_JAN,
      Earnings.of(99),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);
    const projects = toPotentialTransfers(bankingSoft, insuranceSoft);

    //when
    const result: BigNumber = potentialTransfers.checkPotentialTransfer(
      projects,
      BANKING_SOFT_ID,
      INSURANCE_SOFT_ID,
      STASZEK_JAVA_MID,
      JAN_1,
    );

    //then
    assert.ok(result.eq(-9));
  });
});

const toPotentialTransfers = (...projects: Project[]) => {
  const allocations = ObjectMap.empty<ProjectAllocationsId, Allocations>();
  const demands = ObjectMap.empty<ProjectAllocationsId, Demands>();
  const earnings = ObjectMap.empty<ProjectAllocationsId, BigNumber>();
  for (const project of projects) {
    allocations.set(project.id, project.allocations);
    demands.set(project.id, project.demands);
    earnings.set(project.id, project.earnings);
  }
  return new PotentialTransfers(
    new ProjectsAllocationsSummary(ObjectMap.empty(), allocations, demands),
    earnings,
  );
};

class Project {
  public allocations: Allocations = Allocations.none();

  constructor(
    public readonly id: ProjectAllocationsId,
    public readonly demands: Demands,
    public readonly earnings: Earnings,
  ) {}

  add = (allocatedCapability: AllocatedCapability): Allocations => {
    this.allocations = this.allocations.add(allocatedCapability);
    return this.allocations;
  };
}
