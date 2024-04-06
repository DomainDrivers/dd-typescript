import type { ResourceId } from '#availability';
import { Duration, ObjectSet } from '#utils';

export class Stage {
  private readonly stageName: string;
  dependencies: ObjectSet<Stage>;
  resources: ObjectSet<ResourceId>;
  duration: Duration;

  constructor(stageName: string);
  constructor(
    stageName: string,
    dependencies: ObjectSet<Stage>,
    resources: ObjectSet<ResourceId>,
    duration: Duration,
  );
  constructor(
    stageName: string,
    dependencies?: ObjectSet<Stage>,
    resources?: ObjectSet<ResourceId>,
    duration?: Duration,
  ) {
    this.stageName = stageName;
    this.dependencies = dependencies ?? ObjectSet.empty<Stage>();
    this.resources = resources ?? ObjectSet.empty<ResourceId>();
    this.duration = duration ?? Duration.zero;
  }

  public ofDuration = (duration: Duration) =>
    new Stage(this.stageName, this.dependencies, this.resources, duration);

  get name(): string {
    return this.stageName;
  }

  public withChosenResourceCapabilities = (
    ...resources: ResourceId[]
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
}
