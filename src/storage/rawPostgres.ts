import { ObjectMap } from '#utils';
import pg from 'pg';
import type { EnlistableInRawTransaction } from './transactionalDecorator';

const pools: ObjectMap<string, pg.Pool> = ObjectMap.empty();

export const getPool = (connectionString: string) =>
  pools.getOrSet(connectionString, () => new pg.Pool({ connectionString }));

export const endPool = async (connectionString: string): Promise<void> => {
  const pool = pools.get(connectionString);
  if (pool) {
    await pool.end();
    pools.delete(connectionString);
  }
};

export class PostgresRepository implements EnlistableInRawTransaction {
  #client: pg.Client | pg.PoolClient | undefined;

  constructor(client?: pg.Client | pg.PoolClient) {
    this.#client = client;
  }

  protected get client(): pg.Client | pg.PoolClient {
    if (!this.#client) throw new Error('Database client not initialized!');

    return this.#client;
  }

  public enlistRaw = (client: pg.Client): void => {
    this.#client = client;
  };
}
