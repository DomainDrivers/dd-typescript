import {
  Item,
  OptimizationFacade,
  Result,
  TotalCapacity,
  TotalWeight,
  compareItemValueReversed,
  type CapacityDimension,
  type WeightDimension,
} from '../optimization';
import { AvailableResourceCapability } from './availableResourceCapability';
import { Demand } from './demand';
import { SimulatedCapabilities } from './simulatedCapabilities';
import { SimulatedProject } from './simulatedProject';

export class SimulationFacade {
  constructor(private readonly optimizationFacade: OptimizationFacade) {
    this.optimizationFacade = optimizationFacade;
  }

  public whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo = (
    projectsSimulations: SimulatedProject[],
    totalCapability: SimulatedCapabilities,
  ): Result => {
    return this.optimizationFacade.calculate(
      this.toItems(projectsSimulations),
      this.toCapacity(totalCapability),
      compareItemValueReversed,
    );
  };

  private toCapacity = (
    simulatedCapabilities: SimulatedCapabilities,
  ): TotalCapacity => {
    const capabilities: AvailableResourceCapability[] =
      simulatedCapabilities.capabilities;
    const capacityDimensions: CapacityDimension[] = capabilities;
    return new TotalCapacity(capacityDimensions);
  };

  private toItems = (projectsSimulations: SimulatedProject[]): Item[] =>
    projectsSimulations.map((s) => this.toItem(s));

  private toItem = (simulatedProject: SimulatedProject): Item => {
    const missingDemands: Demand[] = simulatedProject.missingDemands.all;
    const weights: WeightDimension[] = missingDemands;
    return new Item(
      simulatedProject.projectId,
      simulatedProject.calculateValue(),
      new TotalWeight(weights),
    );
  };
}
