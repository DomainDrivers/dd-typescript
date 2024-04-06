import { deepEquals } from '../utils';
import { Owner } from './owner';

export class Blockade {
  constructor(
    public readonly takenBy: Owner,
    public readonly disabled: boolean,
  ) {}

  public static none = () => new Blockade(Owner.none(), false);

  public static disabledBy = (owner: Owner) => new Blockade(owner, true);

  public static ownedBy = (owner: Owner) => new Blockade(owner, false);

  canBeTakenBy = (requester: Owner): boolean =>
    this.takenBy.byNone() || deepEquals(this.takenBy, requester);

  isDisabledBy = (owner: Owner): boolean =>
    this.disabled && deepEquals(owner, this.takenBy);
}
