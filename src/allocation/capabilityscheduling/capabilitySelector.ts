import { Capability } from '../../shared';
import type { ObjectSet } from '../../utils';

export class CapabilitySelector {
  public static canPerformOneOf = (
    _capabilities: ObjectSet<Capability>,
  ): CapabilitySelector => null!;

  public static canPerformAllAtTheTime = (
    _beingAnAdmin: ObjectSet<Capability>,
  ): CapabilitySelector => null!;

  public canPerform = (..._capabilities: Capability[]): boolean => false;
}
