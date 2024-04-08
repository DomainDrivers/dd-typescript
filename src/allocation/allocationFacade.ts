import { AvailabilityFacade, Owner, ResourceId } from '#availability';
import { Capability, type TimeSlot } from '#shared';
import { dbconnection, transactional } from '#storage';
import {
  Clock,
  ObjectSet,
  UUID,
  deepEquals,
  event,
  type EventsPublisher,
} from '#utils';
import {
  AllocatableCapabilitiesSummary,
  AllocatableCapabilityId,
  Allocations,
  CapabilityFinder,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
  type CapabilitiesAllocated,
  type ProjectAllocationScheduled,
} from '.';
import type { ProjectAllocationsRepository } from './projectAllocationsRepository';
import { ProjectsAllocationsSummary } from './projectsAllocationsSummary';

export class AllocationFacade {
  constructor(
    private readonly projectAllocationsRepository: ProjectAllocationsRepository,
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly capabilityFinder: CapabilityFinder,
    private readonly eventsPublisher: EventsPublisher,
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
    await this.projectAllocationsRepository.save(projectAllocations);

    await this.eventsPublisher.publish(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        {
          fromTo: timeSlot,
          projectId,
        },
        this.clock,
      ),
    );
    return projectId;
  }

  @dbconnection
  public async findAllProjectsAllocations(
    projectIds?: ObjectSet<ProjectAllocationsId>,
  ): Promise<ProjectsAllocationsSummary> {
    return ProjectsAllocationsSummary.of(
      projectIds
        ? await this.projectAllocationsRepository.findAllById(projectIds)
        : await this.projectAllocationsRepository.findAll(),
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
        AllocatableCapabilityId.toAvailabilityResourceId(
          allocatableCapabilityId,
        ),
        timeSlot,
        Owner.of(projectId),
      ))
    ) {
      return null;
    }

    const event = await this.allocate(
      projectId,
      allocatableCapabilityId,
      capability,
      timeSlot,
    );
    return event?.data.allocatedCapabilityId ?? null;
  }

  private allocate = async (
    projectId: ProjectAllocationsId,
    allocatableCapabilityId: AllocatableCapabilityId,
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<CapabilitiesAllocated | null> => {
    const allocations =
      await this.projectAllocationsRepository.getById(projectId);
    const event = allocations.allocate(
      allocatableCapabilityId,
      capability,
      timeSlot,
      this.clock.now(),
    );
    await this.projectAllocationsRepository.save(allocations);
    return event;
  };

  @transactional
  public async releaseFromProject(
    projectId: ProjectAllocationsId,
    allocatableCapabilityId: AllocatableCapabilityId,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    //can release not scheduled capability - at least for now. Hence no check to capabilityFinder
    await this.availabilityFacade.release(
      AllocatableCapabilityId.toAvailabilityResourceId(allocatableCapabilityId),
      timeSlot,
      Owner.of(projectId),
    );
    const allocations =
      await this.projectAllocationsRepository.getById(projectId);
    const event = allocations.release(
      allocatableCapabilityId,
      timeSlot,
      this.clock.now(),
    );
    await this.projectAllocationsRepository.save(allocations);
    return event !== null;
  }

  @transactional
  public async allocateCapabilityToProjectForPeriod(
    projectId: ProjectAllocationsId,
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    const proposedCapabilities = await this.capabilityFinder.findCapabilities(
      capability,
      timeSlot,
    );
    if (proposedCapabilities.all.length === 0) {
      return false;
    }
    const availabilityResourceIds = ObjectSet.from(
      proposedCapabilities.all.map((resource) =>
        AllocatableCapabilityId.toAvailabilityResourceId(resource.id),
      ),
    );
    const chosen = await this.availabilityFacade.blockRandomAvailable(
      availabilityResourceIds,
      timeSlot,
      Owner.of(projectId),
    );
    if (chosen === null) {
      return false;
    }
    const toAllocate = this.findChosenAllocatableCapability(
      proposedCapabilities,
      chosen,
    );
    return (
      (await this.allocate(projectId, toAllocate, capability, timeSlot)) !==
      null
    );
  }

  private findChosenAllocatableCapability(
    proposedCapabilities: AllocatableCapabilitiesSummary,
    chosen: ResourceId,
  ): AllocatableCapabilityId {
    return (
      proposedCapabilities.all
        .map((s) => s.id)
        .filter((id) =>
          deepEquals(
            AllocatableCapabilityId.toAvailabilityResourceId(id),
            chosen,
          ),
        )[0] ?? null
    );
  }

  @transactional
  public async editProjectDates(
    projectId: ProjectAllocationsId,
    fromTo: TimeSlot,
  ): Promise<void> {
    const projectAllocations =
      await this.projectAllocationsRepository.getById(projectId);
    projectAllocations.defineSlot(fromTo, this.clock.now());
    await this.projectAllocationsRepository.save(projectAllocations);
  }

  @transactional
  public async scheduleProjectAllocationDemands(
    projectId: ProjectAllocationsId,
    demands: Demands,
  ): Promise<void> {
    const projectAllocations =
      (await this.projectAllocationsRepository.findById(projectId)) ??
      ProjectAllocations.empty(projectId);
    const event = projectAllocations.addDemands(demands, this.clock.now());
    if (event) await this.eventsPublisher.publish(event);
    await this.projectAllocationsRepository.save(projectAllocations);
  }
}
