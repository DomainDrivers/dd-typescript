import { AvailabilityFacade } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import { dbconnection } from '../../storage';
import { AllocatableCapabilitiesSummary } from './allocatableCapabilitiesSummary';
import type { AllocatableCapability } from './allocatableCapability';
import {
  toAvailabilityResourceId,
  type AllocatableCapabilityId,
} from './allocatableCapabilityId';
import type { AllocatableCapabilityRepository } from './allocatableCapabilityRepository';
import { AllocatableCapabilitySummary } from './allocatableCapabilitySummary';

export class CapabilityFinder {
  constructor(
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly allocatableResourceRepository: AllocatableCapabilityRepository,
  ) {}

  @dbconnection
  public async findAvailableCapabilities(
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilitiesSummary> {
    const findAllocatableCapability =
      await this.allocatableResourceRepository.findByCapabilityWithin(
        capability.name,
        capability.type,
        timeSlot.from,
        timeSlot.to,
      );
    const found = await this.filterAvailabilityInTimeSlot(
      findAllocatableCapability,
      timeSlot,
    );
    return this.createSummary(found);
  }

  @dbconnection
  public async findCapabilities(
    capability: Capability,
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilitiesSummary> {
    const found =
      await this.allocatableResourceRepository.findByCapabilityWithin(
        capability.name,
        capability.type,
        timeSlot.from,
        timeSlot.to,
      );
    return this.createSummary(found);
  }

  @dbconnection
  public async findById(
    allocatableCapabilityIds: AllocatableCapabilityId[],
  ): Promise<AllocatableCapabilitiesSummary> {
    const allByIdIn = await this.allocatableResourceRepository.findAllById(
      allocatableCapabilityIds,
    );
    return this.createSummary(allByIdIn);
  }

  private async filterAvailabilityInTimeSlot(
    findAllocatableCapability: AllocatableCapability[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapability[]> {
    const resourceIds = ObjectSet.from(
      findAllocatableCapability.map((a) => toAvailabilityResourceId(a.id)),
    );
    const calendars = await this.availabilityFacade.loadCalendars(
      resourceIds,
      timeSlot,
    );
    return findAllocatableCapability.filter((ac) =>
      calendars
        .get(toAvailabilityResourceId(ac.id))
        .availableSlots()
        .some((a) => deepEquals(a, timeSlot)),
    );
  }

  private createSummary(
    from: AllocatableCapability[],
  ): AllocatableCapabilitiesSummary {
    return new AllocatableCapabilitiesSummary(
      from.map(
        (allocatableCapability) =>
          new AllocatableCapabilitySummary(
            allocatableCapability.id,
            allocatableCapability.resourceId,
            allocatableCapability.capability,
            allocatableCapability.slot,
          ),
      ),
    );
  }
}
