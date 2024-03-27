import assert from 'assert';

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

  public static empty<T>(
    _comparison?: (left: T, right: T) => boolean,
  ): ObjectSet<T> {
    return new ObjectSet<T>();
  }

  public static from<T>(
    items: T[],
    comparison?: (left: T, right: T) => boolean,
  ): ObjectSet<T> {
    const set = new ObjectSet<T>(items);
    if (comparison) set.#comparison = comparison;

    return set;
  }

  push(value: T): number {
    if (this.has(value)) return this.length;

    return super.push(value);
  }

  delete(value: T): boolean {
    const index = this.findIndex((o) => this.#comparison(o, value));
    if (index > -1) {
      this.splice(index, 1);
    }

    return index !== -1;
  }

  has(value: T): boolean {
    return this.some((o) => this.#comparison(o, value));
  }

  containsAll(otherSet: ReadonlyArray<T>): boolean {
    return (
      otherSet.filter((dep) => this.some((s) => this.#comparison(s, dep)))
        .length === otherSet.length
    );
  }

  except(toRemove: ReadonlyArray<T>): ObjectSet<T> {
    const valuesToRemove = [...toRemove];
    return new ObjectSet<T>(
      this.filter((o) => !valuesToRemove.some((s) => this.#comparison(s, o))),
    );
  }
}

const deepEquals = <T>(left: T, right: T): boolean => {
  if (isEquatable(left)) {
    return left.equals(right);
  }

  // Fallback to the deep equality comparison
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
};

type Equatable<T> = { equals: (right: T) => boolean } & T;

const isEquatable = <T>(left: T): left is Equatable<T> => {
  return (
    left &&
    typeof left === 'object' &&
    'equals' in left &&
    typeof left['equals'] === 'function'
  );
};
