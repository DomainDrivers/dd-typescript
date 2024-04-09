import { type Repository } from '#storage';
import { ProjectAllocationsId } from '../projectAllocationsId';
import { Cashflow } from './cashflow';

export interface CashflowRepository
  extends Repository<Cashflow, ProjectAllocationsId> {
  findAll(): Promise<Cashflow[]>;
}
