import { ObjectSet } from '../utils';

export class Capability {
  constructor(
    public readonly name: string,
    public readonly type: string,
  ) {}

  public static skill = (name: string) => new Capability(name, 'SKILL');

  public static permission = (name: string) =>
    new Capability(name, 'PERMISSION');

  public static asset = (asset: string) => new Capability(asset, 'ASSET');

  public static skills = (...skills: string[]) =>
    ObjectSet.from(skills.map(Capability.skill));

  public static assets = (...assets: string[]) =>
    ObjectSet.from(assets.map(Capability.asset));

  public static permissions = (...permissions: string[]) =>
    ObjectSet.from(permissions.map(Capability.permission));

  public isOfType = (type: string) => this.type === type;
}
