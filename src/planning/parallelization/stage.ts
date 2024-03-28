import { type Duration } from 'date-fns';
import { ObjectSet } from '../../utils';

export class Stage {
  private readonly stageName: string;
  dependencies: ObjectSet<Stage>;
  resources: ObjectSet<ResourceName>;
  duration: Duration;

  constructor(stageName: string);
  constructor(
    stageName: string,
    dependencies: ObjectSet<Stage>,
    resources: ObjectSet<ResourceName>,
    duration: Duration,
  );
  constructor(
    stageName: string,
    dependencies?: ObjectSet<Stage>,
    resources?: ObjectSet<ResourceName>,
    duration?: Duration,
  ) {
    this.stageName = stageName;
    this.dependencies = dependencies ?? ObjectSet.empty<Stage>();
    this.resources = resources ?? ObjectSet.empty<ResourceName>();
    this.duration = duration ?? {};
  }

  get name(): string {
    return this.stageName;
  }

  public withChosenResourceCapabilities = (
    ...resources: ResourceName[]
  ): Stage => {
    return new Stage(
      this.stageName,
      this.dependencies,
      ObjectSet.from(resources),
      this.duration,
    );
  };

  public dependsOn(stage: Stage): Stage {
    const newDependencies = ObjectSet.from(this.dependencies);
    newDependencies.push(stage);
    this.dependencies.push(stage);

    return new Stage(
      this.stageName,
      newDependencies,
      this.resources,
      this.duration,
    );
  }

  public equals(stage: Stage): boolean {
    return this.stageName === stage.stageName;
  }
}

export type ResourceName = Readonly<{ name: string }>;
