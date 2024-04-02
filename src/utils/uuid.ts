import type { Brand } from '#utils';
import { randomUUID } from 'crypto';

export type UUID = Brand<string, 'UUID'>;

export const UUID = {
  randomUUID: (): UUID => randomUUID() as UUID,
};
