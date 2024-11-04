export type EntityIdentifier = number | string;

export interface Entity {
  id: EntityIdentifier;
}

export interface EntityMap<T extends Entity> {
  [key: EntityIdentifier]: T;
}
