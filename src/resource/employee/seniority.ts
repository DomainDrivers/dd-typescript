import type { Brand } from '../../utils';

const JUNIOR = 'JUNIOR';
const MID = 'MID';
const SENIOR = 'SENIOR';
const LEAD = 'LEAD';

export type Seniority = Brand<
  'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD',
  'Seniority'
>;

export const Seniority = {
  from: (value: string) => value as Seniority,
  JUNIOR: JUNIOR as Seniority,
  MID: MID as Seniority,
  SENIOR: SENIOR as Seniority,
  LEAD: LEAD as Seniority,
};
