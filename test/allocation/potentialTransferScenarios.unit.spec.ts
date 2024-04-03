/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatedCapability,
  AllocationFacade,
  Demand,
  Demands,
  Project,
  Projects,
} from '#allocation';
import { OptimizationFacade } from '#optimization';
import { Capability, TimeSlot } from '#shared';
import { SimulationFacade } from '#simulation';
import { ObjectMap, UUID } from '#utils';
import BigNumber from 'bignumber.js';
import { addMinutes } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
const skill = Capability.skill;

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

  const BANKING_SOFT_ID = UUID.randomUUID();
  const INSURANCE_SOFT_ID = UUID.randomUUID();
  const STASZEK_JAVA_MID = new AllocatedCapability(
    UUID.randomUUID(),
    skill('JAVA-MID'),
    JAN_1,
  );

  const simulationFacade = new AllocationFacade(
    new SimulationFacade(new OptimizationFacade()),
  );

  it('simulates moving capabilities to different project', () => {
    //given
    const bankingSoft = new Project(
      DEMAND_FOR_JAVA_MID_IN_JAN,
      new BigNumber(9),
    );
    const insuranceSoft = new Project(
      DEMAND_FOR_JAVA_MID_IN_JAN,
      new BigNumber(90),
    );
    const projects = new Projects(
      ObjectMap.from([
        [BANKING_SOFT_ID, bankingSoft],
        [INSURANCE_SOFT_ID, insuranceSoft],
      ]),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);

    //when
    const result: BigNumber = simulationFacade.checkPotentialTransfer(
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
      DEMAND_FOR_JAVA_MID_IN_JAN,
      new BigNumber(9),
    );
    const insuranceSoft = new Project(
      DEMAND_FOR_JAVA_JUST_FOR_15MIN_IN_JAN,
      new BigNumber(99),
    );
    const projects = new Projects(
      ObjectMap.from([
        [BANKING_SOFT_ID, bankingSoft],
        [INSURANCE_SOFT_ID, insuranceSoft],
      ]),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);

    //when
    const result: BigNumber = simulationFacade.checkPotentialTransfer(
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
      DEMAND_FOR_JAVA_MID_IN_JAN,
      new BigNumber(9),
    );
    const insuranceSoft = new Project(
      DEMANDS_FOR_JAVA_AND_PYTHON_IN_JAN,
      new BigNumber(99),
    );
    const projects = new Projects(
      ObjectMap.from([
        [BANKING_SOFT_ID, bankingSoft],
        [INSURANCE_SOFT_ID, insuranceSoft],
      ]),
    );
    //and
    bankingSoft.add(STASZEK_JAVA_MID);

    //when
    const result: BigNumber = simulationFacade.checkPotentialTransfer(
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
