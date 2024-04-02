export class Capability {
  constructor(
    public readonly name: string,
    public readonly type: string,
  ) {}

  public static skill = (name: string) => new Capability(name, 'SKILL');

  public static permission = (name: string) =>
    new Capability(name, 'PERMISSION');

  public static asset = (asset: string) => new Capability(asset, 'ASSET');
}
