/* eslint-disable @typescript-eslint/no-floating-promises */
import BigNumber from 'bignumber.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { OptimizationFacade } from '../../src/optimization';
import { TimeSlot } from '../../src/shared';
import {
  AvailableResourceCapability,
  Capability,
  Demand,
  ProjectId,
  SimulationFacade,
} from '../../src/simulation';
import { UUID } from '../../src/utils';
import { AvailableCapabilitiesBuilder } from './availableCapabilitiesBuilder';
import { SimulatedProjectsBuilder } from './simulatedProjectsBuilder';
const demandFor = Demand.demandFor;
const skill = Capability.skill;

describe('SimulationScenarios', () => {
  const JAN_1 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const PROJECT_1 = ProjectId.newOne();
  const PROJECT_2 = ProjectId.newOne();
  const PROJECT_3 = ProjectId.newOne();
  const STASZEK = UUID.randomUUID();
  const LEON = UUID.randomUUID();

  const simulationFacade = new SimulationFacade(new OptimizationFacade());

  const SimulatedProjects = () => new SimulatedProjectsBuilder();

  const SimulatedCapabilities = () => new AvailableCapabilitiesBuilder();

  it('picks optimal project based on earnings', () => {
    //given
    const simulatedProjects = SimulatedProjects()
      .withProject(PROJECT_1)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanEarn(new BigNumber(9))
      .withProject(PROJECT_2)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanEarn(new BigNumber(99))
      .withProject(PROJECT_3)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanEarn(new BigNumber(2))
      .build();

    //and there are
    const simulatedAvailability = SimulatedCapabilities()
      .withEmployee(STASZEK)
      .thatBrings(skill('JAVA-MID'))
      .thatIsAvailableAt(JAN_1)
      .withEmployee(LEON)
      .thatBrings(skill('JAVA-MID'))
      .thatIsAvailableAt(JAN_1)
      .build();

    //when
    const result =
      simulationFacade.whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo(
        simulatedProjects,
        simulatedAvailability,
      );

    //then
    assert.ok(result.profit.eq(108));
    assert.equal(result.chosenItems.length, 2);
  });

  it('picks all when enough capabilities', () => {
    //given
    const simulatedProjects = SimulatedProjects()
      .withProject(PROJECT_1)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanEarn(new BigNumber(99))
      .build();

    //and there are
    const simulatedAvailability = SimulatedCapabilities()
      .withEmployee(STASZEK)
      .thatBrings(skill('JAVA-MID'))
      .thatIsAvailableAt(JAN_1)
      .withEmployee(LEON)
      .thatBrings(skill('JAVA-MID'))
      .thatIsAvailableAt(JAN_1)
      .build();

    //when
    const result =
      simulationFacade.whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo(
        simulatedProjects,
        simulatedAvailability,
      );

    //then
    assert.ok(result.profit.eq(99));
    assert.equal(result.chosenItems.length, 1);
  });

  it('can simulate having extra resources', () => {
    //given
    const simulatedProjects = SimulatedProjects()
      .withProject(PROJECT_1)
      .thatRequires(demandFor(skill('YT DRAMA COMMENTS'), JAN_1))
      .thatCanEarn(new BigNumber(9))
      .withProject(PROJECT_2)
      .thatRequires(demandFor(skill('YT DRAMA COMMENTS'), JAN_1))
      .thatCanEarn(new BigNumber(99))
      .build();

    //and there are
    const simulatedAvailability = SimulatedCapabilities()
      .withEmployee(STASZEK)
      .thatBrings(skill('YT DRAMA COMMENTS'))
      .thatIsAvailableAt(JAN_1)
      .build();

    //and there are
    const extraCapability = new AvailableResourceCapability(
      UUID.randomUUID(),
      skill('YT DRAMA COMMENTS'),
      JAN_1,
    );

    //when
    const resultWithoutExtraResource =
      simulationFacade.whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo(
        simulatedProjects,
        simulatedAvailability,
      );
    const resultWithExtraResource =
      simulationFacade.whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo(
        simulatedProjects,
        simulatedAvailability.add(extraCapability),
      );

    //then
    assert.ok(resultWithoutExtraResource.profit.eq(99));
    assert.ok(resultWithExtraResource.profit.eq(108));
  });

  it('picks optimal project based on reputation', () => {
    //given
    const simulatedProjects = SimulatedProjects()
      .withProject(PROJECT_1)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanGenerateReputationLoss(100)
      .withProject(PROJECT_2)
      .thatRequires(demandFor(skill('JAVA-MID'), JAN_1))
      .thatCanGenerateReputationLoss(40)
      .build();

    //and there are
    const simulatedAvailability = SimulatedCapabilities()
      .withEmployee(STASZEK)
      .thatBrings(skill('JAVA-MID'))
      .thatIsAvailableAt(JAN_1)
      .build();

    //when
    const result =
      simulationFacade.whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo(
        simulatedProjects,
        simulatedAvailability,
      );

    //then
    assert.equal(result.chosenItems[0].name, PROJECT_1);
  });
});
