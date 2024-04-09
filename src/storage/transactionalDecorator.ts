import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { PostgresTransaction } from './drizzle';

export type DatabaseAware<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = {
  ___database: NodePgDatabase<TSchema>;
} & TransactionAware;

const toDatabaseAware = (service: unknown): DatabaseAware | null => {
  const result = service as DatabaseAware;
  if (!result?.___database) return null;

  return result;
};

export interface PostTransactionCommit {
  commit: () => Promise<void>;
}

export const injectDatabase = <
  T,
  TSchema extends Record<string, unknown> = Record<string, never>,
>(
  service: T,
  database: NodePgDatabase<TSchema>,
  postCommit?: () => Promise<void>,
): T => {
  const dbAware = service as DatabaseAware<TSchema>;
  dbAware.___database = database;
  dbAware.___postCommit = postCommit;
  return service;
};

export const nulloTransactionContext = <T>(
  service: T,
  postCommit: () => Promise<void>,
): T => {
  const dbAware = service as DatabaseAware;
  dbAware.___transaction = 'DISABLED';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  dbAware.___database = {} as any;

  dbAware.___postCommit = postCommit;
  return service;
};

export type TransactionAware = {
  ___transaction: PostgresTransaction | 'DISABLED';
  ___postCommit?: () => Promise<void>;
};

const toTransactionAware = (service: unknown): TransactionAware | null => {
  const result = service as TransactionAware;
  if (!result.___transaction) return null;

  return result;
};

export type EnlistableInTransaction<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = {
  enlist: (
    transaction: PostgresTransaction<TSchema> | NodePgDatabase<TSchema>,
  ) => void;
};

export type EnlistableInRawTransaction = {
  enlistRaw: (client: pg.Client) => void;
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

export const dbconnection = (
  target: unknown,
  key: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalDef = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    const db = toDatabaseAware(this)?.___database;

    if (!db) {
      throw Error(
        `Service is not transation aware, wrap your object with 'injectDatabase' call!`,
      );
    }

    enlist(this, { db });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return originalDef.apply(this, args);
  };
  return descriptor;
};

export const transactional = (
  target: unknown,
  key: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalDef = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const withTransaction = toTransactionAware(this);

    if (withTransaction?.___transaction) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await originalDef.apply(this, args);

      if (
        withTransaction.___transaction === 'DISABLED' &&
        withTransaction.___postCommit
      )
        await withTransaction.___postCommit();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    }

    const dbAware = toDatabaseAware(this);
    const db = dbAware?.___database;

    if (!db) {
      throw Error(
        `Service is not transation aware, wrap your object with 'injectDatabaseContext' call!`,
      );
    }

    const result = await db.transaction((tx) => {
      enlist(this, { tx, db });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return originalDef.apply(this, args);
    });

    if (dbAware.___postCommit) await dbAware.___postCommit();

    return result;
  };
  return descriptor;
};

const enlist = (
  obj: PropertyDescriptor,
  { tx, db }: { tx?: PostgresTransaction; db: NodePgDatabase },
) => {
  const context: PostgresTransaction | NodePgDatabase = tx ?? db;

  const client = (context as { session?: { client: pg.Client } }).session
    ?.client;

  for (const fieldName in obj) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    if (typeof (obj as any)[fieldName] === 'function') continue;

    const repository =
      getEnlistableInTransaction(obj, fieldName) ??
      getEnlistableInRawTransaction(obj, fieldName);

    if (repository !== null && 'enlist' in repository) {
      repository.enlist(context);
      continue;
    }

    if (client && repository !== null && 'enlistRaw' in repository) {
      repository.enlistRaw(client);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const dbAware = toDatabaseAware((obj as any)[fieldName]);

    if (dbAware && !dbAware.___database) {
      dbAware.___database = db;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      enlist((obj as any)[fieldName], { tx, db });
    }
  }
};
