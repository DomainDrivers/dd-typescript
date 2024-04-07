export class Optional<T> {
  private constructor(private readonly value: T | null) {}

  public static empty = <T>() => new Optional<T>(null);

  public static of = <T>(value: T | null | undefined) =>
    new Optional<T>(value ?? null);

  public get = () => this.value!;

  public orElseThrow = (): T => {
    if (this.value === null)
      throw new Error('Value in optional was not present!');

    return this.value;
  };

  public map = <Result>(select: (value: T) => Result): Optional<Result> => {
    return this.value !== null
      ? Optional.of(select(this.value))
      : Optional.empty();
  };
}
