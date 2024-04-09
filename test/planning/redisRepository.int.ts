import { ResourceId } from '#availability';
import type { ProjectRepository } from '#planning';
import {
  ChosenResources,
  Demand,
  Demands,
  DemandsPerStage,
  ParallelStages,
  ParallelStagesList,
  Project,
  RedisConfiguration,
  Schedule,
  Stage,
} from '#planning';
import { Capability, TimeSlot } from '#shared';
import { ObjectMap, ObjectSet } from '#utils';
import { UTCDate } from '@date-fns/utc';
import type Redis from 'ioredis';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertEquals, assertIsNotNull, assertThatArray } from '../asserts';
import {
  RedisContainer,
  type StartedRedisContainer,
} from '../setup/redisTestContainer';

const skill = Capability.skill;

void describe('RedisRepository', () => {
  const JAN_10_20 = new TimeSlot(
    new UTCDate('2020-01-10T00:00:00.00Z'),
    new UTCDate('2020-01-20T00:00:00.00Z'),
  );
  const NEEDED_RESOURCES = new ChosenResources(
    ObjectSet.of(ResourceId.newOne()),
    JAN_10_20,
  );
  const SCHEDULE = new Schedule(ObjectMap.from([['Stage1', JAN_10_20]]));
  const DEMAND_FOR_JAVA = new Demands([new Demand(skill('JAVA'))]);
  const DEMANDS_PER_STAGE = DemandsPerStage.empty();
  const STAGES = ParallelStagesList.of(
    new ParallelStages(ObjectSet.of(new Stage('Stage1'))),
  );

  let redisContainer: StartedRedisContainer;
  let redisProjectRepository: ProjectRepository;
  let redisClient: Redis;

  before(async () => {
    redisContainer = await new RedisContainer().start();
    redisClient = redisContainer.getClient();

    redisProjectRepository = new RedisConfiguration(
      redisClient,
    ).projectRepository();
  });

  beforeEach(async () => {
    await redisClient.flushdb();
  });

  after(async () => {
    await redisClient.quit();
    await redisContainer.stop();
  });

  //after(() => redisContainer.stop());

  void it('Can save and load project', async () => {
    //given
    const project = new Project('project', STAGES);
    //and
    project.addSchedule(SCHEDULE);
    //and
    project.addDemands(DEMAND_FOR_JAVA);
    //and
    project.addChosenResources(NEEDED_RESOURCES);
    //and
    project.addDemandsPerStage(DEMANDS_PER_STAGE);
    //and
    await redisProjectRepository.save(project);

    //when
    const loaded = await redisProjectRepository.findById(project.getId());

    //then
    assertIsNotNull(loaded);
    assertEquals(NEEDED_RESOURCES, loaded.getChosenResources());
    assertEquals(STAGES, loaded.getParallelizedStages());
    assertEquals(SCHEDULE, loaded.getSchedule());
    assertEquals(DEMAND_FOR_JAVA, loaded.getAllDemands());
    assertEquals(DEMANDS_PER_STAGE, loaded.getDemandsPerStage());
  });

  void it('Can load multiple projects', async () => {
    //given
    const project = new Project('project', STAGES);
    const project2 = new Project('project2', STAGES);

    //and
    await redisProjectRepository.save(project);
    await redisProjectRepository.save(project2);

    //when
    const loaded = await redisProjectRepository.findAllById(
      ObjectSet.of(project.getId(), project2.getId()),
    );

    //then
    assertThatArray(loaded).hasSize(2);
    const ids = ObjectSet.from(loaded.map((p) => p.getId()));
    assertThatArray(ids).containsExactlyInAnyOrder(
      project2.getId(),
      project.getId(),
    );
  });

  void it('Can load all projects', async () => {
    //given
    const project = new Project('project', STAGES);
    const project2 = new Project('project2', STAGES);

    //and
    await redisProjectRepository.save(project);
    await redisProjectRepository.save(project2);

    //when
    const loaded = await redisProjectRepository.findAll();

    //then
    assertThatArray(loaded).hasSize(2);
    const ids = ObjectSet.from(loaded.map((p) => p.getId()));
    assertThatArray(ids).containsExactlyInAnyOrder(
      project2.getId(),
      project.getId(),
    );
  });
});
