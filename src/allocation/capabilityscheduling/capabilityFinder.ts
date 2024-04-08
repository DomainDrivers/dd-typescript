import { AvailabilityFacade } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { dbconnection } from '#storage';
import { ObjectSet, deepEquals } from '#utils';
import { AllocatableCapabilitiesSummary } from './allocatableCapabilitiesSummary';
import type { AllocatableCapability } from './allocatableCapability';
import { AllocatableCapabilityId } from './allocatableCapabilityId';
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
    return this.createCapabilitiesSummary(found);
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
    return this.createCapabilitiesSummary(found);
  }

  @dbconnection
  public async findById(
    allocatableCapabilityId: AllocatableCapabilityId,
  ): Promise<AllocatableCapabilitySummary | null> {
    const found = await this.allocatableResourceRepository.findById(
      allocatableCapabilityId,
    );
    return found !== null ? this.createCapabilitySummary(found) : null;
  }

  @dbconnection
  public async findAllById(
    allocatableCapabilityIds: AllocatableCapabilityId[],
  ): Promise<AllocatableCapabilitiesSummary> {
    const allByIdIn = await this.allocatableResourceRepository.findAllById(
      allocatableCapabilityIds,
    );
    return this.createCapabilitiesSummary(allByIdIn);
  }

  @dbconnection
  public isPresent(
    allocatableCapabilityId: AllocatableCapabilityId,
  ): Promise<boolean> {
    return this.allocatableResourceRepository.existsById(
      allocatableCapabilityId,
    );
  }

  private async filterAvailabilityInTimeSlot(
    findAllocatableCapability: AllocatableCapability[],
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapability[]> {
    const resourceIds = ObjectSet.from(
      findAllocatableCapability.map((a) =>
        AllocatableCapabilityId.toAvailabilityResourceId(a.id),
      ),
    );
    const calendars = await this.availabilityFacade.loadCalendars(
      resourceIds,
      timeSlot,
    );
    return findAllocatableCapability.filter((ac) =>
      calendars
        .get(AllocatableCapabilityId.toAvailabilityResourceId(ac.id))
        .availableSlots()
        .some((a) => deepEquals(a, timeSlot)),
    );
  }

  private createCapabilitiesSummary = (
    from: AllocatableCapability[],
  ): AllocatableCapabilitiesSummary =>
    new AllocatableCapabilitiesSummary(
      from.map(
        (allocatableCapability) =>
          new AllocatableCapabilitySummary(
            allocatableCapability.id,
            allocatableCapability.resourceId,
            allocatableCapability.capabilities,
            allocatableCapability.slot,
          ),
      ),
    );

  private createCapabilitySummary = (
    from: AllocatableCapability,
  ): AllocatableCapabilitySummary =>
    new AllocatableCapabilitySummary(
      from.id,
      from.resourceId,
      from.capabilities,
      from.slot,
    );
}
