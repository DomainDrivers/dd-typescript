import type { AllocationFacade } from '#allocation';
import type { TimeSlot } from '#shared';
import { transactional } from '#storage';
import { ProjectId, Stage, type ProjectRepository } from '.';

export class EditStageDateService {
  constructor(
    private readonly allocationFacade: AllocationFacade,
    private readonly projectRepository: ProjectRepository,
  ) {}

  @transactional
  public async editStageDate(
    projectId: ProjectId,
    _stage: Stage,
    _newSlot: TimeSlot,
  ): Promise<void> {
    const project = await this.projectRepository.getById(projectId);
    const _schedule = project.getSchedule();
    //redefine schedule
    //for each stage in schedule
    //recreate allocation
    //reallocate chosen resources (or find equivalents)
    //start risk analysis
  }
}
