import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { PostgresTransaction } from './drizzle';

type DatabaseAware<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = { ___getDatabase: () => NodePgDatabase<TSchema> };

export type EnlistableInTransaction<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = { enlist: (transaction: PostgresTransaction<TSchema>) => void };

export type EnlistableInRawTransaction = {
  enlistRaw: (client: pg.Client) => void;
};

export const injectTransactionContext = <
  T,
  TSchema extends Record<string, unknown> = Record<string, never>,
>(
  service: T,
  getDatabase: () => NodePgDatabase<TSchema>,
): T => {
  (service as DatabaseAware<TSchema>).___getDatabase = getDatabase;
  return service;
};

const toDatabaseAware = (service: unknown): DatabaseAware => {
  const result = service as DatabaseAware;
  if (!result.___getDatabase)
    throw Error(
      `Service is not transation aware, wrap your object with 'injectTransactionContext' call!`,
    );

  return result;
};

const getEnlistableInTransaction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  enlistableFieldName: string,
): EnlistableInTransaction | null => {
  if (
    !service ||
    !(enlistableFieldName in service) ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof service[enlistableFieldName] === 'undefined'
  ) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const enlistable = service[enlistableFieldName] as EnlistableInTransaction;

  if (!enlistable.enlist || !(enlistable.enlist instanceof Function)) {
    return null;
  }

  return enlistable;
};

const getEnlistableInRawTransaction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  enlistableFieldName: string,
): EnlistableInRawTransaction | null => {
  if (
    !service ||
    !(enlistableFieldName in service) ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof service[enlistableFieldName] === 'undefined'
  ) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const enlistable = service[enlistableFieldName] as EnlistableInRawTransaction;

  if (!enlistable.enlistRaw || !(enlistable.enlistRaw instanceof Function)) {
    return null;
  }

  return enlistable;
};

export const transactional =
  (repositoryFieldNames: string[] = ['repository']) =>
  (
    target: unknown,
    key: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalDef = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const db = toDatabaseAware(this).___getDatabase();

      return db.transaction((tx) => {
        for (const repositoryFieldName of repositoryFieldNames) {
          const repository =
            getEnlistableInTransaction(this, repositoryFieldName) ??
            getEnlistableInRawTransaction(this, repositoryFieldName);

          if (repository !== null && 'enlist' in repository) {
            repository.enlist(tx);
            continue;
          }

          const client = (tx as { session?: { client: pg.Client } }).session
            ?.client;

          if (client && repository !== null && 'enlistRaw' in repository) {
            repository.enlistRaw(client);
            continue;
          }

          throw new Error(
            `${repositoryFieldName} wasn't found, cannot enlist!`,
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return originalDef.apply(this, args);
      });
    };
    return descriptor;
  };
