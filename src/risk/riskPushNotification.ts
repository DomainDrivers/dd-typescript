// TODO: Remove this after adding implementation
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AllocatableCapabilitiesSummary,
  AllocatableCapabilityId,
  Demand,
  ProjectAllocationsId,
} from '#allocation';
import { ResourceId } from '#availability';
import { Demands } from '#planning';
import { ProjectId } from '#simulation';
import { ObjectMap, ObjectSet } from '#utils';
import { TimeSlot } from '../shared';

export class RiskPushNotification {
  public notifyDemandsSatisfied = (
    projectId: ProjectAllocationsId,
  ): Promise<void> => Promise.resolve();

  public notifyAboutAvailability = (
    projectId: ProjectAllocationsId,
    available: ObjectMap<Demand, AllocatableCapabilitiesSummary>,
  ): Promise<void> => Promise.resolve();

  public notifyProfitableRelocationFound = (
    projectId: ProjectAllocationsId,
    allocatableCapabilityId: AllocatableCapabilityId,
  ): Promise<void> => Promise.resolve();

  public notifyAboutPossibleRisk = (
    projectId: ProjectAllocationsId,
  ): Promise<void> => Promise.resolve();

  public notifyAboutPossibleRiskDuringPlanning = (
    cause: ProjectId,
    demands: Demands,
  ): Promise<void> => Promise.resolve();

  public notifyAboutCriticalResourceNotAvailable = (
    cause: ProjectId,
    criticalResource: ResourceId,
    timeSlot: TimeSlot,
  ): Promise<void> => Promise.resolve();

  public notifyAboutResourcesNotAvailable = (
    projectId: ProjectId,
    notAvailable: ObjectSet<ResourceId>,
  ): Promise<void> => Promise.resolve();
}
