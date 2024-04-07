import { AvailabilityFacade, Owner } from '#availability';
import { Capability, type TimeSlot } from '#shared';
import { dbconnection, transactional } from '#storage';
import { Clock, ObjectSet, type UUID } from '#utils';
import {
  AllocatableCapabilityId,
  Allocations,
  CapabilityFinder,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
  toAvailabilityResourceId,
} from '.';
import type { ProjectAllocationsRepository } from './projectAllocationsRepository';
import { ProjectsAllocationsSummary } from './projectsAllocationsSummary';

export class AllocationFacade {
  constructor(
    private readonly repository: ProjectAllocationsRepository,
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly capabilityFinder: CapabilityFinder,
    private readonly clock: Clock,
  ) {}

  @transactional
  public async createAllocation(
    timeSlot: TimeSlot,
    scheduledDemands: Demands,
  ): Promise<ProjectAllocationsId> {
    const projectId = ProjectAllocationsId.newOne();
    const projectAllocations = new ProjectAllocations(
      projectId,
      Allocations.none(),
      scheduledDemands,
      timeSlot,
    );
    await this.repository.save(projectAllocations);
    return projectId;
  }

  @dbconnection
  public async findAllProjectsAllocations(
    projectIds?: ObjectSet<ProjectAllocationsId>,
  ): Promise<ProjectsAllocationsSummary> {
    return ProjectsAllocationsSummary.of(
      projectIds
        ? await this.repository.findAllById(projectIds)
        : await this.repository.findAll(),
    );
  }

  @transactional
  public async allocateToProject(
    projectId: ProjectAllocationsId,
    allocatableCapabilityId: AllocatableCapabilityId,
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<UUID | null> {
    //yes, one transaction crossing 2 modules.
    if (!(await this.capabilityFinder.isPresent(allocatableCapabilityId))) {
      return null;
    }
    if (
      !(await this.availabilityFacade.block(
        toAvailabilityResourceId(allocatableCapabilityId),
        timeSlot,
        Owner.of(projectId),
      ))
    ) {
      return null;
    }
    const allocations = await this.repository.getById(projectId);
    const event = allocations.allocate(
      allocatableCapabilityId,
      capability,
      timeSlot,
      this.clock.now(),
    );
    await this.repository.save(allocations);
    return event?.allocatedCapabilityId ?? null;
  }

  @transactional
  public async releaseFromProject(
    projectId: ProjectAllocationsId,
    allocatableCapabilityId: AllocatableCapabilityId,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    //can release not scheduled capability - at least for now. Hence no check to capabilityFinder
    await this.availabilityFacade.release(
      toAvailabilityResourceId(allocatableCapabilityId),
      timeSlot,
      Owner.of(projectId),
    );
    const allocations = await this.repository.getById(projectId);
    const event = allocations.release(
      allocatableCapabilityId,
      timeSlot,
      this.clock.now(),
    );
    await this.repository.save(allocations);
    return event !== null;
  }

  @transactional
  public async editProjectDates(
    projectId: ProjectAllocationsId,
    fromTo: TimeSlot,
  ): Promise<void> {
    const projectAllocations = await this.repository.getById(projectId);
    projectAllocations.defineSlot(fromTo, this.clock.now());
    await this.repository.save(projectAllocations);
  }

  @transactional
  public async scheduleProjectAllocationDemands(
    projectId: ProjectAllocationsId,
    demands: Demands,
  ): Promise<void> {
    const projectAllocations =
      (await this.repository.findById(projectId)) ??
      ProjectAllocations.empty(projectId);
    projectAllocations.addDemands(demands, this.clock.now());
    await this.repository.save(projectAllocations);
  }
}
