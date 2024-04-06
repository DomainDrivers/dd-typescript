import assert from 'assert';
import { deepEquals } from '../../src/utils';

export const assertThat = <T>(item: T) => {
  return {
    isEqualTo: (other: T) => assert.ok(deepEquals(item, other)),
  };
};

export const assertEquals = <T>(item: T, other: T) => {
  return assert.ok(deepEquals(item, other));
};

export const assertThatArray = <T>(array: T[]) => {
  return {
    isEmpty: () => assert.equal(array.length, 0),
    containsElements: (...other: T[]) => {
      assert.ok(other.every((ts) => other.some((o) => deepEquals(ts, o))));
    },
    containsExactlyInAnyOrderElementsOf: (other: T[]) => {
      assert.equal(array.length, other.length);
      assert.ok(array.every((ts) => other.some((o) => deepEquals(ts, o))));
    },
    containsExactlyElementsOf: (other: T[]) => {
      assert.equal(array.length, other.length);
      for (let i = 0; i < array.length; i++) {
        assert.ok(deepEquals(array[i], other[i]));
      }
    },
    containsExactly: (elem: T) => {
      assert.equal(array.length, 1);
      assert.ok(deepEquals(array[0], elem));
    },
    contains: (elem: T) => {
      assert.ok(array.some((a) => deepEquals(a, elem)));
    },
    containsOnlyOnceElementsOf: (other: T[]) => {
      assert.ok(
        other
          .map((o) => array.filter((a) => deepEquals(a, o)).length)
          .filter((a) => a === 1).length == other.length,
      );
    },
  };
};