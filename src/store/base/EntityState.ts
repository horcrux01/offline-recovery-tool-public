import { Entity, EntityIdentifier } from 'models/entity';

export interface EntityState<T extends Entity = Entity> {
  entities: { [id: EntityIdentifier]: T };
  currentId?: EntityIdentifier;
}
