import type { ProjectAllocationsId } from '..';
import type { Cost } from './cost';
import type { Earnings } from './earnings';
import type { Income } from './income';

export class Cashflow {
  private _projectId: ProjectAllocationsId;
  private _income: Income | null;
  private _cost: Cost | null;
  private _version: number;

  constructor(
    projectId: ProjectAllocationsId,
    income: Income | null = null,
    cost: Cost | null = null,
    version: number = 0,
  ) {
    this._projectId = projectId;
    this._income = income;
    this._cost = cost;
    this._version = version;
  }

  public earnings = (): Earnings => this._income!.minus(this._cost!);

  public update = (income: Income, cost: Cost) => {
    this._income = income;
    this._cost = cost;
  };

  public get projectId() {
    return this._projectId;
  }
  public get income() {
    return this._income;
  }
  public get cost() {
    return this._cost;
  }
  public get version() {
    return this._version;
  }
}
