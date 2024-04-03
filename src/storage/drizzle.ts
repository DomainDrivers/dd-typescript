import {
  Column,
  and,
  eq,
  type DrizzleConfig,
  type ExtractTablesWithRelations,
} from 'drizzle-orm';
import {
  drizzle,
  type NodePgDatabase,
  type NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type {
  PgInsertValue,
  PgTable,
  PgTransaction,
} from 'drizzle-orm/pg-core';
import pg from 'pg';
import { schema } from '../planning';
import { type Repository } from './repository';

const pools: Map<string, pg.Pool> = new Map();

export const getPool = (connectionString: string) => {
  const existing = pools.get(connectionString);

  if (existing) return existing;

  const pool = new pg.Pool({ connectionString });

  pools.set(connectionString, pool);

  return pool;
};

export const endPool = (connectionString: string): Promise<void> => {
  const existing = pools.get(connectionString);

  if (!existing) return Promise.resolve();

  return existing.end();
};

export const getDB = <
  TSchema extends Record<string, unknown> = Record<string, never>,
>(
  connectionString: string,
  config: DrizzleConfig<TSchema>,
): NodePgDatabase<TSchema> => drizzle(getPool(connectionString), config);

export type PostgresTransaction<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = PgTransaction<
  NodePgQueryResultHKT,
  TSchema,
  ExtractTablesWithRelations<TSchema>
>;

export abstract class DrizzleRepository<
  Entity,
  Id,
  TSchema extends Record<string, unknown> = Record<string, never>,
> implements Repository<Entity, Id>
{
  #db!: PostgresTransaction<TSchema>;

  protected get db() {
    return this.#db;
  }

  public enlist = (transaction: PostgresTransaction<TSchema>): void => {
    this.#db = transaction;
  };

  public abstract findById(id: Id): Promise<Entity | null>;

  public getById = async (id: Id) => {
    const entity = await this.findById(id);

    if (entity === null)
      throw new Error(`Entity with '${id?.toString()}' was not found!`);

    return entity;
  };

  public abstract findAllById(ids: Id[]): Promise<Entity[]>;

  public abstract save(entity: Entity): Promise<void>;

  protected upsert = async <
    TTable extends PgTable,
    InsertSchema extends PgInsertValue<TTable>,
    IdColumn extends Column,
    VersionColumn extends Column,
  >(
    entity: InsertSchema,
    toUpdate: Partial<InsertSchema> & Record<string, unknown>,
    options: {
      id: [IdColumn, Id];
      version: [VersionColumn, number];
    },
  ): Promise<void> => {
    const [idColumn, id] = options.id;
    const [versionColumn, version] = options.version;

    const update = toUpdate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (update[versionColumn.name] as any) = version + 1;

    const result = await this.db
      .insert(idColumn.table)
      .values(entity)
      .onConflictDoUpdate({
        target: schema.projects.id,
        set: { ...update, versionColumn: version + 1 },
        where: and(eq(idColumn, id), eq(versionColumn, version)),
      });

    if (result.rowCount === 0)
      throw Error(
        `Invalid version '${version} for record with id '${id?.toString()}`,
      );
  };
}
