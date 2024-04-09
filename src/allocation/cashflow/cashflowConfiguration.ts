import { getDB, injectDatabase } from '#storage';
import { UtilsConfiguration } from '#utils';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CashFlowFacade } from './cashflowFacade';
import { type CashflowRepository } from './cashflowRepository';
import * as schema from './schema';
import { DrizzleCashflowRepository } from './drizzleCashflowRepository';

export class CashflowConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly utils: UtilsConfiguration = new UtilsConfiguration(),
    private readonly enableLogging: boolean = false,
  ) {}

  public cashflowFacade = (
    cashflowRepository?: CashflowRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): CashFlowFacade => {
    const repository = cashflowRepository ?? this.cashflowRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabase(
      new CashFlowFacade(repository, this.utils.eventBus, this.utils.clock),
      getDB(),
      this.utils.eventBus.commit,
    );
  };

  public cashflowRepository = (): CashflowRepository =>
    new DrizzleCashflowRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
