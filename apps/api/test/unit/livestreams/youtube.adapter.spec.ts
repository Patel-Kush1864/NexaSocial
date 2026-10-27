/* eslint-disable @typescript-eslint/require-await */
import { YoutubeAdapter } from '../../../src/livestreams/adapters/youtube.adapter';

describe('YoutubeAdapter (Unit)', () => {
  let adapter: YoutubeAdapter;

  beforeEach(() => {
    adapter = new YoutubeAdapter();
    jest.clearAllMocks();
  });

  const createMockResponse = (data: any, ok = true) => ({
    ok,
    text: async () => JSON.stringify(data),
    json: async () => data,
  });

  describe('createBroadcast', () => {
    it('should return mock broadcast details when accessToken is mock or missing', async () => {
      const res = await adapter.createBroadcast('mock_token', 'My Test Stream');
      expect(res).toBeDefined();
      expect(res.platformStreamId).toContain('yt_broadcast_mock_');
      expect(res.streamUrl).toBe('rtmps://a.rtmps.youtube.com/live2');
      expect(res.streamKey).toContain('x-youtube-key-');
    });

    it('should handle real API call and return broadcast and stream details', async () => {
      const mockBroadcastRes = {
        id: 'broadcast-123',
        snippet: { title: 'Live Stream' },
        status: { lifeCycleStatus: 'ready' },
      };
      const mockStreamRes = {
        items: [
          {
            id: 'stream-456',
            cdn: {
              ingestionInfo: {
                ingestionAddress: 'rtmps://a.rtmps.youtube.com/live2',
                streamName: 'test-real-stream-key',
              },
            },
          },
        ],
      };

      global.fetch = jest
        .fn()
        // 1. liveBroadcasts POST
        .mockResolvedValueOnce(createMockResponse(mockBroadcastRes) as any)
        // 2. liveStreams GET
        .mockResolvedValueOnce(createMockResponse(mockStreamRes) as any)
        // 3. liveBroadcasts/bind POST
        .mockResolvedValueOnce(createMockResponse({ id: 'broadcast-123' }) as any);

      const res = await adapter.createBroadcast(
        'real_oauth_token_with_valid_length_123456789',
        'Live Stream',
        'Description',
      );

      expect(res.platformStreamId).toBe('broadcast-123');
      expect(res.streamId).toBe('stream-456');
      expect(res.streamUrl).toBe('rtmps://a.rtmps.youtube.com/live2');
      expect(res.streamKey).toBe('test-real-stream-key');
    });

    it('should fallback gracefully if createBroadcast throws an error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network offline'));

      const res = await adapter.createBroadcast(
        'real_oauth_token_with_valid_length_123456789',
        'Live Stream',
      );

      expect(res.platformStreamId).toContain('yt_broadcast_fallback_');
      expect(res.streamUrl).toBe('rtmps://a.rtmps.youtube.com/live2');
      expect(res.streamKey).toContain('x-youtube-key-');
    });
  });

  describe('getViewerUrl', () => {
    it('should construct YouTube watch URL', async () => {
      const url = await adapter.getViewerUrl('any_token', 'vid123');
      expect(url).toBe('https://www.youtube.com/watch?v=vid123');
    });
  });

  describe('startBroadcast', () => {
    it('should do nothing if token is mock', async () => {
      global.fetch = jest.fn();
      await adapter.startBroadcast('mock_token', 'bcast-1');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip transition when enableAutoStart is true', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        createMockResponse({
          items: [
            {
              status: { lifeCycleStatus: 'ready' },
              contentDetails: { enableAutoStart: true },
            },
          ],
        }) as any,
      );

      await adapter.startBroadcast('real_valid_token_123456789', 'bcast-1');
      // Should not call transition endpoint
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopBroadcast', () => {
    it('should do nothing if token is mock', async () => {
      global.fetch = jest.fn();
      await adapter.stopBroadcast('mock_token', 'bcast-1');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should transition broadcast to complete', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          createMockResponse({ id: 'bcast-1', status: { lifeCycleStatus: 'complete' } }) as any,
        );

      await adapter.stopBroadcast('real_valid_token_123456789', 'bcast-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transition?id=bcast-1&broadcastStatus=complete'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
