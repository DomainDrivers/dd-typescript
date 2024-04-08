import { OptimizationConfiguration } from '#optimization';
import { SimulationFacade } from '.';

export class SimulationConfiguration {
  constructor(
    private readonly optimizationConfiguration: OptimizationConfiguration = new OptimizationConfiguration(),
  ) {}
  public simulationFacade = () =>
    new SimulationFacade(this.optimizationConfiguration.optimizationFacade());
}
