import type { RedisConfig } from '#planning';
import { Redis } from 'ioredis';
import {
  AbstractStartedContainer,
  GenericContainer,
  type StartedTestContainer,
  type StopOptions,
  type StoppedTestContainer,
} from 'testcontainers';

const REDIS_PORT = 6379;
const REDIS_IMAGE_NAME = 'redis';

let container: RedisContainer | null = null;
let startedContainer: StartedRedisContainer | null = null;
let startedCount = 0;

export const getRedisTestContainer = async () => {
  if (startedContainer) return startedContainer;

  if (!container) container = new RedisContainer();

  startedContainer = await container.start();
  startedCount++;

  return startedContainer;
};

export const getTestRedisClient = async () => {
  return (await getRedisTestContainer()).getClient();
};

export const stopRedisTestContainer = async () => {
  if (startedContainer && --startedCount === 0)
    try {
      await startedContainer.stop();
    } catch {
      /* do nothing */
    }
  container = null;
  startedContainer = null;
};

export class RedisContainer extends GenericContainer {
  constructor(image = REDIS_IMAGE_NAME, withReuse = false) {
    super(image);
    this.withExposedPorts(REDIS_PORT);

    if (withReuse) this.withReuse();
  }

  async start(): Promise<StartedRedisContainer> {
    return new StartedRedisContainer(await super.start());
  }
}

export class StartedRedisContainer extends AbstractStartedContainer {
  private client?: Redis;
  constructor(container: StartedTestContainer) {
    super(container);
  }

  public getConfig = (): RedisConfig => {
    return { host: this.getHost(), port: this.getMappedPort(REDIS_PORT) };
  };

  public getClient = (): Redis => {
    if (!this.client) this.client = new Redis(this.getConfig());
    return this.client;
  };

  public stop = async (
    options?: Partial<StopOptions>,
  ): Promise<StoppedTestContainer> => {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (error) {
        /* do nothing */
      }
    }
    return super.stop(options);
  };
}
