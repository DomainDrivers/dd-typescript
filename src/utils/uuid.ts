import type { Brand } from '#utils';
import { randomUUID } from 'crypto';

export type UUID<Kind = unknown> = Brand<string, 'UUID'> & { __uuid: Kind };

export const UUID = {
  randomUUID: (): UUID => randomUUID() as UUID,
  from: (uuid: string) => uuid as UUID,
};
