export const createMockQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  process: jest.fn(),
  getJob: jest.fn().mockResolvedValue(null),
  getJobs: jest.fn().mockResolvedValue([]),
  pause: jest.fn().mockResolvedValue(true),
  resume: jest.fn().mockResolvedValue(true),
  clean: jest.fn().mockResolvedValue([]),
});
