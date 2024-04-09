import { type Repository } from '#storage';
import { UTCDate } from '@date-fns/utc';
import { ProjectAllocations, ProjectAllocationsId } from '.';

export interface ProjectAllocationsRepository
  extends Repository<ProjectAllocations, ProjectAllocationsId> {
  findAllById(ids: ProjectAllocationsId[]): Promise<ProjectAllocations[]>;
  findAll(): Promise<ProjectAllocations[]>;
  findAllContainingDate(when: UTCDate): Promise<ProjectAllocations[]>;
}
