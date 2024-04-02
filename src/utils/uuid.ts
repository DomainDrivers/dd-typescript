import { randomUUID } from 'crypto';
import type { Brand } from '../utils';

export type UUID = Brand<string, 'UUID'>;

export const UUID = {
  randomUUID: (): UUID => randomUUID() as UUID,
};
