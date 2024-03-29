import { deepEquals } from './equatable';

export class ObjectSet<T> extends Array<T> {
  #comparison: (left: T, right: T) => boolean;
  constructor(...items: T[]);
  constructor(items: T[]);
  constructor(arrayLength: number);
  constructor(objectsOrLength: Array<T> | number) {
    if (objectsOrLength === undefined) super(0);
    else if (objectsOrLength instanceof Array) super(...objectsOrLength);
    else super(objectsOrLength);

    this.#comparison = deepEquals;

    Object.setPrototypeOf(this, ObjectSet.prototype);
  }

  public static empty = <T>(
    comparison?: (left: T, right: T) => boolean,
  ): ObjectSet<T> => ObjectSet.from<T>([], comparison);

  public static from = <T>(
    items: T[],
    comparison?: (left: T, right: T) => boolean,
  ): ObjectSet<T> => {
    const set = new ObjectSet<T>(items);
    if (comparison) set.#comparison = comparison;

    return set;
  };

  push = (value: T): number =>
    this.has(value) ? this.length : super.push(value);

  pushAll = (objectsToAdd: ReadonlyArray<T>): number => {
    for (const toAdd of objectsToAdd) {
      this.push(toAdd);
    }
    return this.length;
  };

  delete = (value: T): boolean => {
    const index = this.findIndex((o) => this.#comparison(o, value));
    if (index > -1) {
      this.splice(index, 1);
    }

    return index !== -1;
  };

  deleteAll = (objectsToRemove: ReadonlyArray<T>): number => {
    for (const toRemove of objectsToRemove) {
      this.delete(toRemove);
    }
    return this.length;
  };

  has = (value: T): boolean => this.some((o) => this.#comparison(o, value));

  containsAll = (otherSet: ReadonlyArray<T>): boolean =>
    otherSet.filter((o) => this.some((s) => this.#comparison(s, o))).length ===
    otherSet.length;

  containsAnyElementsOf = (otherSet: ReadonlyArray<T>): boolean =>
    otherSet.some((o) => this.some((s) => this.#comparison(s, o)));

  except = (toRemove: ReadonlyArray<T>): ObjectSet<T> => {
    const valuesToRemove = [...toRemove];
    return new ObjectSet<T>(
      this.filter((o) => !valuesToRemove.some((s) => this.#comparison(s, o))),
    );
  };
}
