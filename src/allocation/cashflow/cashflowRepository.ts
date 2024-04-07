import { DrizzleRepository, type Repository } from '#storage';
import { UUID } from '#utils';
import { eq, inArray } from 'drizzle-orm';
import { ProjectAllocationsId } from '../projectAllocationsId';
import { Cashflow } from './cashflow';
import { Cost } from './cost';
import { Income } from './income';
import * as schema from './schema';

export interface CashflowRepository
  extends Repository<Cashflow, ProjectAllocationsId> {}

export class DrizzleCashflowRepository
  extends DrizzleRepository<Cashflow, ProjectAllocationsId, typeof schema>
  implements CashflowRepository
{
  constructor() {
    super(schema.cashflows, schema.cashflows.id, schema.cashflows.version);
  }

  public findById = async (
    id: ProjectAllocationsId,
  ): Promise<Cashflow | null> => {
    const result = await this.db.query.cashflows.findFirst({
      where: eq(schema.cashflows.id, id),
    });

    return result ? mapToCashflow(result) : null;
  };

  public findAllById = async (
    ids: ProjectAllocationsId[],
  ): Promise<Cashflow[]> => {
    const result = await this.db
      .select()
      .from(schema.cashflows)
      .where(inArray(schema.cashflows.id, ids));

    return result.map(mapToCashflow);
  };

  public save = async (cashflow: Cashflow): Promise<void> => {
    const entity = mapFromCashFlow(cashflow);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: cashflow.projectId,
    });
  };
}

const mapToCashflow = (entity: schema.CashflowEntity): Cashflow =>
  new Cashflow(
    ProjectAllocationsId.from(UUID.from(entity.id)),
    entity.income ? Income.of(entity.income) : null,
    entity.cost ? Cost.of(entity.cost) : null,
  );
const mapFromCashFlow = (cashflow: Cashflow): schema.CashflowEntity => {
  return {
    id: cashflow.projectId,
    income: cashflow.income?.toNumber() ?? null,
    cost: cashflow.cost?.toNumber() ?? null,
    version: cashflow.version,
  };
};
