import { type Duration } from 'date-fns';

export class Stage {
  #dependencies: Set<Stage>;
  #resources: Set<ResourceName>;
  #duration: Duration;

  constructor(stageName: string);
  constructor(
    private readonly stageName: string,
    dependencies?: Set<Stage>,
    resources?: Set<ResourceName>,
    duration?: Duration,
  ) {
    this.#dependencies = dependencies ?? new Set<Stage>();
    this.#resources = resources ?? new Set<ResourceName>();
    this.#duration = duration ?? {};
  }

  get name(): string {
    return this.stageName;
  }

  public dependsOn(stage: Stage): Stage {
    this.#dependencies.add(stage);
    return this;
  }

  public equals(stage: Stage): boolean {
    return this.stageName === stage.stageName;
  }
}

export type ResourceName = Readonly<{ name: string }>;
