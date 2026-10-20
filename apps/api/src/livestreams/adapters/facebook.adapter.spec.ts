import { FacebookAdapter } from './facebook.adapter';
import * as safeJsonHelper from '../helpers/safe-json.helper';

describe('FacebookAdapter', () => {
  let adapter: FacebookAdapter;

  beforeEach(() => {
    adapter = new FacebookAdapter();
    jest.spyOn(safeJsonHelper, 'safeJson').mockImplementation(async (res: any) => res.json());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createBroadcast', () => {
    it('should create a broadcast with UNPUBLISHED status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test_stream_id',
          secure_stream_url: 'rtmps://live-api-s.facebook.com:443/rtmp/12345?s_bl=1'
        })
      });

      const result = await adapter.createBroadcast('test_token', 'Test Title', 'Test Desc');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v23.0/me/live_videos?access_token=test_token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Title',
            description: 'Test Desc',
            status: 'UNPUBLISHED'
          })
        })
      );
      expect(result.platformStreamId).toBe('test_stream_id');
      expect(result.streamUrl).toBe('rtmps://live-api-s.facebook.com:443/rtmp/');
      expect(result.streamKey).toBe('12345?s_bl=1');
    });
  });

  describe('startBroadcast', () => {
    it('should explicitly set status to LIVE_NOW', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await adapter.startBroadcast('test_token', 'test_stream_id');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v23.0/test_stream_id?access_token=test_token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ status: 'LIVE_NOW' })
        })
      );
    });
  });

  describe('waitForStreamActive', () => {
    it('should return true when dash_preview_url is present', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ dash_preview_url: 'https://fb.watch/preview', status: 'UNPUBLISHED' })
      });

      const result = await adapter.waitForStreamActive('test_token', 'test_stream_id', 1000);
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v23.0/test_stream_id?fields=status,dash_preview_url&access_token=test_token'
      );
    });

    it('should return false if dash_preview_url is absent until timeout', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'UNPUBLISHED' }) // no dash_preview_url
      });

      const startTime = Date.now();
      const result = await adapter.waitForStreamActive('test_token', 'test_stream_id', 100);
      const elapsed = Date.now() - startTime;
      
      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('getViewerUrl', () => {
    it('should return permalink_url directly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ permalink_url: '/watch/live/?v=123' })
      });

      const url = await adapter.getViewerUrl('test_token', 'test_stream_id');
      expect(url).toBe('https://www.facebook.com/watch/live/?v=123');
    });

    it('should return absolute permalink_url if provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ permalink_url: 'https://fb.watch/123/' })
      });

      const url = await adapter.getViewerUrl('test_token', 'test_stream_id');
      expect(url).toBe('https://fb.watch/123/');
    });

    it('should fallback to default watch url if API fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      const url = await adapter.getViewerUrl('test_token', 'test_stream_id');
      expect(url).toBe('https://www.facebook.com/watch/live/?v=test_stream_id');
    });
  });
});
