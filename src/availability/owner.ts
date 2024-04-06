import { UUID, deepEquals } from '#utils';

export class Owner {
  constructor(public readonly owner: UUID) {}

  public static none = () => new Owner(null!);

  static newOne = () => new Owner(UUID.randomUUID());

  public byNone = () => deepEquals(Owner.none(), this);
}
