import {
  Allocations,
  CreateHourlyDemandsSummaryService,
  Demand,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
} from '#allocation';
import { Capability, TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { describe, it } from 'node:test';
import { assertEquals, assertThatArray } from '../asserts';

const skill = Capability.skill;

void describe('CreateHourlyDemandsSummaryService', () => {
  const NOW = new UTCDate();
  const JAN = TimeSlot.createMonthlyTimeSlotAtUTC(2021, 1);
  const CSHARP = Demands.of(new Demand(skill('CSHARP'), JAN));
  const JAVA = Demands.of(new Demand(skill('JAVA'), JAN));

  const service = new CreateHourlyDemandsSummaryService();

  void it('Creates missing demands summary for all given projects', () => {
    //given
    const csharpProjectId = ProjectAllocationsId.newOne();
    const javaProjectId = ProjectAllocationsId.newOne();
    const csharpProject = new ProjectAllocations(
      csharpProjectId,
      Allocations.none(),
      CSHARP,
      JAN,
    );
    const javaProject = new ProjectAllocations(
      javaProjectId,
      Allocations.none(),
      JAVA,
      JAN,
    );

    //when
    const result = service.create([csharpProject, javaProject], NOW);

    //then
    assertEquals(NOW, result.data.occurredAt);
    const expectedMissingDemands = ObjectMap.from([
      [javaProjectId, JAVA],
      [csharpProjectId, CSHARP],
    ]);
    assertThatArray(
      result.data.missingDemands,
    ).containsExactlyInAnyOrderElementsOf(expectedMissingDemands);
  });

  void it('Takes into account only projects with time slot', () => {
    //given
    const withTimeSlotId = ProjectAllocationsId.newOne();
    const withoutTimeSlotId = ProjectAllocationsId.newOne();
    const withTimeSlot = new ProjectAllocations(
      withTimeSlotId,
      Allocations.none(),
      CSHARP,
      JAN,
    );
    const withoutTimeSlot = new ProjectAllocations(
      withoutTimeSlotId,
      Allocations.none(),
      JAVA,
    );

    //when
    const result = service.create([withTimeSlot, withoutTimeSlot], NOW);

    //then
    assertEquals(NOW, result.data.occurredAt);
    const expectedMissingDemands = ObjectMap.from([[withTimeSlotId, CSHARP]]);
    assertThatArray(
      result.data.missingDemands,
    ).containsExactlyInAnyOrderElementsOf(expectedMissingDemands);
  });
});
