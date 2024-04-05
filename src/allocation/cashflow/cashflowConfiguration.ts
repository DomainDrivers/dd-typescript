import { getDB, injectTransactionContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  DrizzleCashflowRepository,
  type CashflowRepository,
} from './cashflowRepository';
import * as schema from './schema';
import { CashflowFacade } from './cashflowFacade';

export class CashflowConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  public cashflowFacade = (
    cashflowRepository?: CashflowRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): CashflowFacade => {
    const repository = cashflowRepository ?? this.cashflowRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectTransactionContext(new CashflowFacade(repository), getDB);
  };

  public cashflowRepository = (): CashflowRepository =>
    new DrizzleCashflowRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
