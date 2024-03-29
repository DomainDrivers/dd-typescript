import assert from 'assert';

export const deepEquals = <T>(left: T, right: T): boolean => {
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

export type Equatable<T> = { equals: (right: T) => boolean } & T;

export const isEquatable = <T>(left: T): left is Equatable<T> => {
  return (
    left &&
    typeof left === 'object' &&
    'equals' in left &&
    typeof left['equals'] === 'function'
  );
};
