import {
  Column,
  and,
  eq,
  sql,
  type DrizzleConfig,
  type ExtractTablesWithRelations,
} from 'drizzle-orm';
import {
  drizzle,
  type NodePgDatabase,
  type NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type {
  IndexColumn,
  PgInsertValue,
  PgTable,
  PgTransaction,
} from 'drizzle-orm/pg-core';
import { getPool } from './rawPostgres';
import { type Repository } from './repository';
import type { EnlistableInTransaction } from './transactionalDecorator';

export const getDB = <
  TSchema extends Record<string, unknown> = Record<string, never>,
>(
  connectionString: string,
  config?: DrizzleConfig<TSchema>,
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
  >
  implements Repository<Entity, Id>, EnlistableInTransaction<TSchema>
{
  #db!: PostgresTransaction<TSchema> | NodePgDatabase<TSchema>;

  constructor(
    protected readonly table: PgTable,
    protected readonly idColumn: IndexColumn,
    protected readonly versionColumn?: Column | undefined,
  ) {}

  protected get db() {
    return this.#db;
  }

  public enlist = (
    transaction: PostgresTransaction<TSchema> | NodePgDatabase<TSchema>,
  ): void => {
    this.#db = transaction;
  };

  public abstract findById(id: Id): Promise<Entity | null>;

  public getById = async (id: Id) => {
    const entity = await this.findById(id);

    if (entity === null)
      throw new Error(`Entity with '${id?.toString()}' was not found!`);

    return entity;
  };

  public existsById = async (id: Id): Promise<boolean> =>
    (
      await this.db
        .select({
          exists: sql<number>`1`,
        })
        .from(this.table)
        .where(eq(this.idColumn, id))
    ).length > 0;

  public abstract save(entity: Entity): Promise<void>;

  protected upsert = async <
    TTable extends PgTable,
    InsertSchema extends PgInsertValue<TTable>,
  >(
    entity: InsertSchema,
    toUpdate: Partial<InsertSchema> & Record<string, unknown>,
    options: {
      id: Id;
      version?: number;
    },
  ): Promise<void> => {
    const { id, version } = options;

    const update = toUpdate;

    if (version) {
      if (!this.versionColumn) {
        throw Error("You provided version but didn't define version column!");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (update[this.versionColumn.name] as any) = version + 1;
    }

    const set = version ? { ...update, versionColumn: version + 1 } : toUpdate;
    const where =
      version && this.versionColumn
        ? and(eq(this.idColumn, id), eq(this.versionColumn, version))
        : eq(this.idColumn, id);

    const result = await this.db
      .insert(this.table)
      .values(entity)
      .onConflictDoUpdate({
        target: this.idColumn,
        set,
        where,
      });

    if (result.rowCount === 0)
      throw Error(
        `Invalid version '${version} for record with id '${id?.toString()}`,
      );
  };
}
