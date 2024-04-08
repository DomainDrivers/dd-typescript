import { OptimizationFacade } from '#optimization';

export class OptimizationConfiguration {
  public optimizationFacade = () => new OptimizationFacade();
}
