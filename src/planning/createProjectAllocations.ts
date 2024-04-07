import type { AllocationFacade } from '#allocation';
import { transactional } from '#storage';
import type { ProjectId, ProjectRepository } from '.';

export class CreateProjectAllocations {
  constructor(
    private readonly allocationFacade: AllocationFacade,
    private readonly projectRepository: ProjectRepository,
  ) {}

  //can react to ScheduleCalculated event
  @transactional
  public async createProjectAllocations(projectId: ProjectId): Promise<void> {
    const project = await this.projectRepository.getById(projectId);
    const _schedule = project.getSchedule();
    //for each stage in schedule
    //create allocation
    //allocate chosen resources (or find equivalents)
    //start risk analysis
  }
}
