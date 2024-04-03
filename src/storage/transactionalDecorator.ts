import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PostgresTransaction } from './drizzle';

type DatabaseAware<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = { ___getDatabase: () => NodePgDatabase<TSchema> };

type EnlistableInTransaction<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = { enlist: (transaction: PostgresTransaction<TSchema>) => void };

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
): EnlistableInTransaction => {
  if (
    !service ||
    !(enlistableFieldName in service) ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof service[enlistableFieldName] === 'undefined'
  ) {
    throw new Error(`${enlistableFieldName} wasn't found, cannot enlist!`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const enlistable = service[enlistableFieldName] as EnlistableInTransaction;

  if (!enlistable.enlist || !(enlistable.enlist instanceof Function)) {
    throw new Error(
      `${enlistableFieldName} doesn't have enlist method, cannot enlist!`,
    );
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
          const repository = getEnlistableInTransaction(
            this,
            repositoryFieldName,
          );

          repository.enlist(tx);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return originalDef.apply(this, args);
      });
    };
    return descriptor;
  };
