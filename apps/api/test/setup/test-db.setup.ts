import { DataSource } from 'typeorm';

export const createMockDataSource = (): Partial<DataSource> => ({
  isInitialized: true,
  initialize: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {},
  }),
});
