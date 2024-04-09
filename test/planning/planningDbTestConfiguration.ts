import type { Project, ProjectRepository } from '#planning';
import type { ProjectId } from '#simulation';
import { InMemoryRepository } from '#storage';

export class PlanningDbTestConfiguration {
  public static inMemoryProjectDb = (): ProjectRepository =>
    new InMemoryProjectRepository();
}

export class InMemoryProjectRepository
  extends InMemoryRepository<Project, ProjectId>
  implements ProjectRepository
{
  constructor() {
    super((p) => p.getId());
  }
}
