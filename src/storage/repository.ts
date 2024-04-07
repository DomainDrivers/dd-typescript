export interface Repository<Entity, Id> {
  getById(id: Id): Promise<Entity>;
  existsById(id: Id): Promise<boolean>;
  findById(id: Id): Promise<Entity | null>;
  findAllById(ids: Id[]): Promise<Entity[]>;
  save(entity: Entity): Promise<void>;
}
