import { deepEquals } from './equatable';

type KeyValue<Key, Value> = { readonly key: Key; value: Value };

export class ObjectMap<Key, Value> extends Array<KeyValue<Key, Value>> {
  #comparison: (left: Key, right: Key) => boolean;
  constructor(items: KeyValue<Key, Value>[]);
  constructor(arrayLength: number);
  constructor(objectsOrLength: KeyValue<Key, Value>[] | number) {
    if (objectsOrLength === undefined) super(0);
    else if (objectsOrLength instanceof Array) super(...objectsOrLength);
    else super(objectsOrLength);

    this.#comparison = deepEquals;

    Object.setPrototypeOf(this, ObjectMap.prototype);
  }

  public static empty = <Key, Value>(
    comparison?: (left: Key, right: Key) => boolean,
  ): ObjectMap<Key, Value> => ObjectMap.from<Key, Value>([], comparison);

  public static from = <Key, Value>(
    items: KeyValue<Key, Value>[],
    comparison?: (left: Key, right: Key) => boolean,
  ): ObjectMap<Key, Value> => {
    const set = new ObjectMap<Key, Value>(items);
    if (comparison) set.#comparison = comparison;

    return set;
  };

  get = (key: Key): Value | null =>
    this.find((o) => this.#comparison(o.key, key))?.value ?? null;

  set = (key: Key, value: Value) => {
    const keyValue = this.find((o) => this.#comparison(o.key, key));

    if (keyValue) {
      keyValue.value = value;
    } else {
      super.push({ key, value });
    }
  };

  push = (value: KeyValue<Key, Value>): number =>
    this.has(value.key) ? this.length : super.push(value);

  delete = (value: Key): boolean => {
    const index = this.findIndex((o) => this.#comparison(o.key, value));
    if (index > -1) {
      this.splice(index, 1);
    }

    return index !== -1;
  };

  has = (key: Key): boolean => {
    return this.some((o) => this.#comparison(o.key, key));
  };
}
