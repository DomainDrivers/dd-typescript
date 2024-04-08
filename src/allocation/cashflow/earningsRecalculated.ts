import type { Event } from '#utils';
import type { ProjectAllocationsId } from '../projectAllocationsId';
import type { Earnings } from './earnings';

export type EarningsRecalculated = Event<
  'EarningsRecalculated',
  {
    projectId: ProjectAllocationsId;
    earnings: Earnings;
  }
>;
