import type { PublishedEvent } from '#utils';
import type { ProjectAllocationsId } from '../projectAllocationsId';
import type { Earnings } from './earnings';

export type EarningsRecalculated = PublishedEvent<
  'EarningsRecalculated',
  {
    projectId: ProjectAllocationsId;
    earnings: Earnings;
  }
>;
