import { deepEquals } from '#utils';
import assert from 'assert';

export const assertThat = <T>(item: T) => {
  return {
    isEqualTo: (other: T) => assertTrue(deepEquals(item, other)),
  };
};

export const assertEquals = <T>(item: T, other: T) => {
  return assertTrue(deepEquals(item, other));
};
export function assertFalse(result: boolean): asserts result is false {
  assert.equal(result, false);
}

export function assertTrue(result: boolean): asserts result is true {
  assert.equal(result, true);
  assert.ok(result);
}

export function assertIsNotNull<T extends object>(
  result: T | null,
): asserts result is T {
  assert.notEqual(result, null);
  assert.ok(result);
}

export function assertIsNull<T extends object>(
  result: T | null,
): asserts result is null {
  assert.equal(result, null);
}

export const assertThatArray = <T>(array: T[]) => {
  return {
    isEmpty: () => assert.equal(array.length, 0),
    hasSize: (length: number) => assert.equal(array.length, length),
    containsElements: (...other: T[]) => {
      assertTrue(other.every((ts) => other.some((o) => deepEquals(ts, o))));
    },
    containsExactlyInAnyOrder: (...other: T[]) => {
      assert.equal(array.length, other.length);
      assertTrue(array.every((ts) => other.some((o) => deepEquals(ts, o))));
    },
    containsExactlyInAnyOrderElementsOf: (other: T[]) => {
      assert.equal(array.length, other.length);
      assertTrue(array.every((ts) => other.some((o) => deepEquals(ts, o))));
    },
    containsExactlyElementsOf: (other: T[]) => {
      assert.equal(array.length, other.length);
      for (let i = 0; i < array.length; i++) {
        assertTrue(deepEquals(array[i], other[i]));
      }
    },
    containsExactly: (elem: T) => {
      assert.equal(array.length, 1);
      assertTrue(deepEquals(array[0], elem));
    },
    contains: (elem: T) => {
      assertTrue(array.some((a) => deepEquals(a, elem)));
    },
    containsOnlyOnceElementsOf: (other: T[]) => {
      assertTrue(
        other
          .map((o) => array.filter((a) => deepEquals(a, o)).length)
          .filter((a) => a === 1).length === other.length,
      );
    },
    containsAnyOf: (...other: T[]) => {
      assertTrue(array.some((a) => other.some((o) => deepEquals(a, o))));
    },
    allMatch: (matches: (item: T) => boolean) => {
      assertTrue(array.every(matches));
    },
    anyMatches: (matches: (item: T) => boolean) => {
      assertTrue(array.some(matches));
    },
    allMatchAsync: async (
      matches: (item: T) => Promise<boolean>,
    ): Promise<void> => {
      for (const item of array) {
        assertTrue(await matches(item));
      }
    },
  };
};
