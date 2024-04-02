import BigNumber from 'bignumber.js';
import { ObjectMap, ObjectSet } from '../utils';
import type { AvailableResourceCapability } from './availableResourceCapability';
import type { Demands } from './demands';
import { Result } from './result';
import { SimulatedCapabilities } from './simulatedCapabilities';
import { SimulatedProject } from './simulatedProject';

export class SimulationFacade {
  public whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo = (
    projectsSimulations: SimulatedProject[],
    totalCapability: SimulatedCapabilities,
  ): Result => {
    const list = totalCapability.capabilities;
    const capacitiesSize = list.length;
    const dp = new Array<BigNumber>(capacitiesSize + 1).fill(new BigNumber(0));
    const chosenItemsList = new Array<SimulatedProject[]>(
      capacitiesSize + 1,
    ).fill([]);
    const allocatedCapacitiesList = new Array<
      ObjectSet<AvailableResourceCapability>
    >(capacitiesSize + 1).fill(ObjectSet.empty<AvailableResourceCapability>());

    const automaticallyIncludedItems = projectsSimulations.filter((project) =>
      project.allDemandsSatisfied(),
    );
    const guaranteedValue = automaticallyIncludedItems.reduce(
      (prev, cur) => prev.plus(cur.earnings),
      new BigNumber(0),
    );

    const allAvailabilities = ObjectSet.from(list);
    const itemToCapacitiesMap = ObjectMap.empty<
      SimulatedProject,
      ObjectSet<AvailableResourceCapability>
    >();

    for (const project of projectsSimulations.sort((a, b) =>
      b.earnings.comparedTo(a.earnings),
    )) {
      const chosenCapacities: AvailableResourceCapability[] =
        this.matchCapacities(project.missingDemands, allAvailabilities);
      allAvailabilities.deleteAll(chosenCapacities);

      if (chosenCapacities.length === 0) {
        continue;
      }

      const sumValue = project.earnings;
      const chosenCapacitiesCount = chosenCapacities.length;

      for (let j = capacitiesSize; j >= chosenCapacitiesCount; j--) {
        if (dp[j].lt(sumValue.plus(dp[j - chosenCapacitiesCount]))) {
          dp[j] = sumValue.plus(dp[j - chosenCapacitiesCount]);

          chosenItemsList[j] = [...chosenItemsList[j - chosenCapacitiesCount]];
          chosenItemsList[j].push(project);

          allocatedCapacitiesList[j].pushAll(chosenCapacities);
        }
      }
      itemToCapacitiesMap.set(project, ObjectSet.from(chosenCapacities));
    }

    chosenItemsList[capacitiesSize] = [
      ...chosenItemsList[capacitiesSize],
      ...automaticallyIncludedItems,
    ];
    return new Result(
      dp[capacitiesSize].plus(guaranteedValue),
      chosenItemsList[capacitiesSize],
      itemToCapacitiesMap,
    );
  };

  private matchCapacities = (
    demands: Demands,
    availableCapacities: ObjectSet<AvailableResourceCapability>,
  ): AvailableResourceCapability[] => {
    const result: AvailableResourceCapability[] = [];
    for (const weightComponent of demands.all) {
      const matchingCapacity =
        availableCapacities.find((c) => weightComponent.isSatisfiedBy(c)) ??
        null;

      if (matchingCapacity != null) {
        result.push(matchingCapacity);
      } else {
        return [];
      }
    }
    return result;
  };
}
