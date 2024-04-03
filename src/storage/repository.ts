export interface Repository<Entity, Id> {
  getById(id: Id): Promise<Entity>;
  findById(id: Id): Promise<Entity | null>;
  findAllById(ids: Id[]): Promise<Entity[]>;
  save(entity: Entity): Promise<void>;
}
