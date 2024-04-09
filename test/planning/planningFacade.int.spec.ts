import {
  PlanningConfiguration,
  RedisConfiguration,
  Stage,
  schema,
  type PlanningFacade,
} from '#planning';
import { after, before, describe, it } from 'node:test';
import { assertEquals } from '../asserts';
import { TestConfiguration } from '../setup';

void describe('PlanningFacadeIntegration', () => {
  const testEnvironment = TestConfiguration();
  let projectFacade: PlanningFacade;

  before(async () => {
    const { connectionString, redisClient } = await testEnvironment.start(
      {
        schema,
      },
      true,
    );

    const configuration = new PlanningConfiguration(
      new RedisConfiguration(redisClient!),
      connectionString,
    );

    projectFacade = configuration.planningFacade();
  });

  after(async () => await testEnvironment.stop());

  void it('Can create project and load project card', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    //when
    const loaded = await projectFacade.load(projectId);

    //then
    assertEquals(projectId, loaded.projectId);
    assertEquals('project', loaded.name);
    assertEquals('Stage1', loaded.parallelizedStages.print());
  });
});
