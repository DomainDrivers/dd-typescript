import { ObjectMap, event, type PublishedEvent } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type NotSatisfiedDemands = PublishedEvent<
  'NotSatisfiedDemands',
  {
    missingDemands: ObjectMap<ProjectAllocationsId, Demands>;
  }
>;

export const NotSatisfiedDemands = {
  forOneProject: (
    projectId: ProjectAllocationsId,
    scheduledDemands: Demands,
    occurredAt?: UTCDate,
  ): NotSatisfiedDemands =>
    event('NotSatisfiedDemands', {
      missingDemands: ObjectMap.from([[projectId, scheduledDemands]]),
      occurredAt,
    }),
  allSatisfied: (
    projectId: ProjectAllocationsId,
    occurredAt?: UTCDate,
  ): NotSatisfiedDemands =>
    event('NotSatisfiedDemands', {
      missingDemands: ObjectMap.from([[projectId, Demands.none()]]),
      occurredAt,
    }),
};
