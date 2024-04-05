import type { ProjectAllocationsId } from '..';
import type { Cost } from './cost';
import type { Earnings } from './earnings';
import type { Income } from './income';

export class Cashflow {
  #projectId: ProjectAllocationsId;
  #income: Income | null;
  #cost: Cost | null;
  #version: number;

  constructor(
    projectId: ProjectAllocationsId,
    income: Income | null = null,
    cost: Cost | null = null,
    version: number = 0,
  ) {
    this.#projectId = projectId;
    this.#income = income;
    this.#cost = cost;
    this.#version = version;
  }

  public earnings = (): Earnings => this.#income!.minus(this.#cost!);

  public update = (income: Income, cost: Cost) => {
    this.#income = income;
    this.#cost = cost;
  };

  public get projectId() {
    return this.#projectId;
  }
  public get income() {
    return this.#income;
  }
  public get cost() {
    return this.#cost;
  }
  public get version() {
    return this.#version;
  }
}
