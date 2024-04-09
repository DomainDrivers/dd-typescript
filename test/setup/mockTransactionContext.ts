export const mockTransactionContext = <T>(instance: T): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (instance as any).___transaction = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (instance as any).___database = {};
  return instance;
};
