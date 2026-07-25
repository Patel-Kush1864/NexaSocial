import { createMockQueue } from '../mocks/queue.mock';

describe('Background Queue Jobs Test Suite (Step 15)', () => {
  let mockStreamQueue: any;

  beforeEach(() => {
    mockStreamQueue = createMockQueue();
  });

  it('should schedule background job for stream start', async () => {
    const jobData = {
      streamId: 'stream-123',
      workspaceId: 'ws-456',
      scheduledTime: new Date().toISOString(),
    };

    const result = await mockStreamQueue.add('start-stream', jobData);
    expect(mockStreamQueue.add).toHaveBeenCalledWith('start-stream', jobData);
    expect(result.id).toBeDefined();
  });

  it('should clean up completed background jobs from queue', async () => {
    mockStreamQueue.clean.mockResolvedValue(['job-1', 'job-2']);
    const cleaned = await mockStreamQueue.clean(5000, 'completed');
    expect(cleaned).toHaveLength(2);
  });
});
