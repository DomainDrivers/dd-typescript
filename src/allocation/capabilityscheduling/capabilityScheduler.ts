import { AvailabilityFacade } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { dbconnection, transactional } from '#storage';
import type { ObjectSet } from '#utils';
import { CapabilitySelector } from '.';
import { AllocatableCapability } from './allocatableCapability';
import { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableCapabilityRepository } from './allocatableCapabilityRepository';
import { AllocatableResourceId } from './allocatableResourceId';

export class CapabilityScheduler {
  constructor(
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly allocatableResourceRepository: AllocatableCapabilityRepository,
  ) {}

  @transactional
  public async scheduleResourceCapabilitiesForPeriod(
    resourceId: AllocatableResourceId,
    capabilities: CapabilitySelector[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    const allocatableResourceIds = await this.createAllocatableResources(
      resourceId,
      capabilities,
      timeSlot,
    );
    for (const resource of allocatableResourceIds) {
      await this.availabilityFacade.createResourceSlots(
        AllocatableCapabilityId.toAvailabilityResourceId(resource),
        timeSlot,
      );
    }
    return allocatableResourceIds;
  }

  @transactional
  public async scheduleMultipleResourcesForPeriod(
    resources: ObjectSet<AllocatableResourceId>,
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    const allocatableCapability = resources.map(
      (resource) =>
        new AllocatableCapability(
          resource,
          CapabilitySelector.canJustPerform(capability),
          timeSlot,
        ),
    );
    await this.allocatableResourceRepository.saveAll(allocatableCapability);

    for (const resource of allocatableCapability) {
      await this.availabilityFacade.createResourceSlots(
        AllocatableCapabilityId.toAvailabilityResourceId(resource.id),
        timeSlot,
      );
    }
    return allocatableCapability.map((a) => a.id);
  }

  private async createAllocatableResources(
    resourceId: AllocatableResourceId,
    capabilities: CapabilitySelector[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    const allocatableResources = capabilities.map(
      (capability) =>
        new AllocatableCapability(resourceId, capability, timeSlot),
    );
    await this.allocatableResourceRepository.saveAll(allocatableResources);
    return allocatableResources.map((a) => a.id);
  }

  @dbconnection
  public async findResourceCapabilities(
    allocatableResourceId: AllocatableResourceId,
    capabilities: Capability | ObjectSet<Capability>,
    period: TimeSlot,
  ): Promise<AllocatableCapabilityId | null> {
    return Array.isArray(capabilities)
      ? (
          await this.allocatableResourceRepository.findByResourceIdAndTimeSlot(
            allocatableResourceId,
            period.from,
            period.to,
          )
        )
          .filter((ac) => ac.canPerform(capabilities))
          .map((ac) => ac.id)[0] ?? null
      : (
          await this.allocatableResourceRepository.findByResourceIdAndCapabilityAndTimeSlot(
            allocatableResourceId,
            capabilities.name,
            capabilities.type,
            period.from,
            period.to,
          )
        )?.id ?? null;
  }
}
