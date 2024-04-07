import { Capability } from '#shared';
import { ObjectSet, type Brand } from '#utils';

export type SelectingPolicy = Brand<
  'ALL_SIMULTANEOUSLY' | 'ONE_OF_ALL',
  'SelectingPolicy'
>;

export const SelectingPolicy = {
  from: (value: string) => value as SelectingPolicy,
  ALL_SIMULTANEOUSLY: 'ALL_SIMULTANEOUSLY' as SelectingPolicy,
  ONE_OF_ALL: 'ONE_OF_ALL' as SelectingPolicy,
};

export class CapabilitySelector {
  constructor(
    public readonly capabilities: ObjectSet<Capability>,
    public readonly selectingPolicy: SelectingPolicy,
  ) {}

  public static canPerformOneOf = (
    capabilities: ObjectSet<Capability>,
  ): CapabilitySelector =>
    new CapabilitySelector(capabilities, SelectingPolicy.ONE_OF_ALL);

  public static canPerformAllAtTheTime = (
    capabilities: ObjectSet<Capability>,
  ): CapabilitySelector =>
    new CapabilitySelector(capabilities, SelectingPolicy.ALL_SIMULTANEOUSLY);

  public static canJustPerform = (capability: Capability) =>
    new CapabilitySelector(
      ObjectSet.of(capability),
      SelectingPolicy.ONE_OF_ALL,
    );

  public canPerform = (...capabilities: Capability[]): boolean => {
    if (capabilities.length == 1) {
      return this.capabilities.containsAll(capabilities);
    }
    return (
      this.selectingPolicy === SelectingPolicy.ALL_SIMULTANEOUSLY &&
      this.capabilities.containsAll(capabilities)
    );
  };
}
