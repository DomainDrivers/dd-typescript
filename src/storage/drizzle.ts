import {
  Column,
  SQL,
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
    IdColumn extends IndexColumn,
    VersionColumn extends Column,
  >(
    entity: InsertSchema,
    toUpdate: Partial<InsertSchema> & Record<string, unknown>,
    options: {
      id: [IdColumn, Id];
      version?: [VersionColumn, number];
    },
  ): Promise<void> => {
    const [idColumn, id] = options.id;

    const update = toUpdate;

    let set = toUpdate;
    let where: SQL<unknown> | undefined = eq(idColumn, id);

    if (options.version) {
      const [versionColumn, version] = options.version;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (update[versionColumn.name] as any) = version + 1;

      set = { ...update, versionColumn: version + 1 };
      where = and(eq(idColumn, id), eq(versionColumn, version));
    }

    const result = await this.db
      .insert(idColumn.table)
      .values(entity)
      .onConflictDoUpdate({
        target: idColumn,
        set,
        where,
      });

    if (result.rowCount === 0)
      throw Error(
        `Invalid version '${options.version?.[1] ?? ''} for record with id '${id?.toString()}`,
      );
  };
}
