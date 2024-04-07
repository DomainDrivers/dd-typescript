import { AvailabilityFacade } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { transactional } from '#storage';
import type { ObjectSet } from '#utils';
import { AllocatableCapability } from './allocatableCapability';
import {
  toAvailabilityResourceId,
  type AllocatableCapabilityId,
} from './allocatableCapabilityId';
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
    capabilities: Capability[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    const allocatableResourceIds = await this.createAllocatableResources(
      resourceId,
      capabilities,
      timeSlot,
    );
    for (const resource of allocatableResourceIds) {
      await this.availabilityFacade.createResourceSlots(
        toAvailabilityResourceId(resource),
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
      (resource) => new AllocatableCapability(resource, capability, timeSlot),
    );
    await this.allocatableResourceRepository.saveAll(allocatableCapability);

    for (const resource of allocatableCapability) {
      await this.availabilityFacade.createResourceSlots(
        toAvailabilityResourceId(resource.id),
        timeSlot,
      );
    }
    return allocatableCapability.map((a) => a.id);
  }

  private async createAllocatableResources(
    resourceId: AllocatableResourceId,
    capabilities: Capability[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    const allocatableResources = capabilities.map(
      (capability) =>
        new AllocatableCapability(resourceId, capability, timeSlot),
    );
    await this.allocatableResourceRepository.saveAll(allocatableResources);
    return allocatableResources.map((a) => a.id);
  }
}
