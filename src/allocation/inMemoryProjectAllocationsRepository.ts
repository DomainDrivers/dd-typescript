import type { UTCDate } from '@date-fns/utc';
import { isAfter, isBefore } from 'date-fns';
import { InMemoryRepository } from '../storage';
import type { ProjectAllocations } from './projectAllocations';
import type { ProjectAllocationsId } from './projectAllocationsId';
import type { ProjectAllocationsRepository } from './projectAllocationsRepository';

export class InMemoryProjectAllocationsRepository
  extends InMemoryRepository<ProjectAllocations, ProjectAllocationsId>
  implements ProjectAllocationsRepository
{
  constructor() {
    super((pa) => pa.id);
  }

  findAllContainingDate(when: UTCDate): Promise<ProjectAllocations[]> {
    return Promise.resolve(
      this.items
        .map(({ value }) => value)
        .filter(
          (e) =>
            isBefore(e.timeSlot.from, when) && isAfter(e.timeSlot.to, when),
        ),
    );
  }
}
