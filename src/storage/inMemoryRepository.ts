import { ObjectMap, deepEquals } from '#utils';
import type { Repository } from './repository';

export abstract class InMemoryRepository<Entity, Key>
  implements Repository<Entity, Key>
{
  constructor(protected getId: (entity: Entity) => Key) {}

  protected items: ObjectMap<Key, Entity> = ObjectMap.empty();

  async getById(id: Key): Promise<Entity> {
    const entity = await this.findById(id);

    if (entity === null)
      throw new Error(`Entity with '${id?.toString()}' was not found!`);

    return entity;
  }
  existsById(id: Key): Promise<boolean> {
    return Promise.resolve(this.items.has(id));
  }
  findById(id: Key): Promise<Entity | null> {
    return Promise.resolve(this.items.get(id));
  }
  findAllById(ids: Key[]): Promise<Entity[]> {
    return Promise.resolve(
      this.items
        .map(({ value }) => value)
        .filter((pa) => ids.some((i) => deepEquals(i, this.getId(pa)))),
    );
  }
  findAll(): Promise<Entity[]> {
    return Promise.resolve(this.items.map(({ value }) => value));
  }
  save(entity: Entity): Promise<void> {
    this.items.set(this.getId(entity), entity);
    return Promise.resolve();
  }
}
