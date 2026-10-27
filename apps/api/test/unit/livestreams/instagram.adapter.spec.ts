import { Test, TestingModule } from '@nestjs/testing';
import { InstagramAdapter } from '../../../src/livestreams/adapters/instagram.adapter';
import { BadRequestException } from '@nestjs/common';

describe('InstagramAdapter (Unit)', () => {
  let adapter: InstagramAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstagramAdapter],
    }).compile();

    adapter = module.get<InstagramAdapter>(InstagramAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('getStreamingMode', () => {
    it('should return UNSUPPORTED for personal accounts or ineligible accounts', () => {
      expect(adapter.getStreamingMode({ accountType: 'PERSONAL' })).toBe('UNSUPPORTED');
      expect(adapter.getStreamingMode({ isLiveEligible: false })).toBe('UNSUPPORTED');
    });

    it('should return LIVE_PRODUCER for business or creator accounts', () => {
      expect(adapter.getStreamingMode({ accountType: 'BUSINESS', isLiveEligible: true })).toBe(
        'LIVE_PRODUCER',
      );
      expect(
        adapter.getStreamingMode({ accountType: 'MEDIA_CREATOR', isLiveEligible: true }),
      ).toBe('LIVE_PRODUCER');
    });
  });

  describe('validateIngestUrl', () => {
    it('should accept official Instagram / Meta RTMPS ingest endpoints', () => {
      expect(
        adapter.validateIngestUrl('rtmps://live-upload.instagram.com:443/rtmp/'),
      ).toBe(true);
      expect(
        adapter.validateIngestUrl('rtmp://live-upload.instagram.com:80/rtmp/'),
      ).toBe(true);
    });

    it('should reject non-RTMP schemes', () => {
      expect(adapter.validateIngestUrl('https://live-upload.instagram.com/rtmp/')).toBe(false);
      expect(adapter.validateIngestUrl('ftp://live-upload.instagram.com/rtmp/')).toBe(false);
    });

    it('should reject loopback, internal, and SSRF private IP addresses', () => {
      expect(adapter.validateIngestUrl('rtmp://localhost:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://127.0.0.1:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://[::1]:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://10.0.0.1:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://192.168.1.1:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://172.16.0.1:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://172.24.1.100:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://172.31.255.255:1935/live')).toBe(false);
      expect(adapter.validateIngestUrl('rtmp://169.254.169.254/latest/meta-data/')).toBe(false);
    });
  });

  describe('buildRtmpDestination', () => {
    it('should safely concatenate baseUrl with streamKey when trailing slash is present', () => {
      const dest = adapter.buildRtmpDestination(
        'rtmps://live-upload.instagram.com:443/rtmp/',
        'AQB3x9Y_valid_key',
      );
      expect(dest).toBe(
        'rtmps://live-upload.instagram.com:443/rtmp/AQB3x9Y_valid_key',
      );
    });

    it('should safely concatenate baseUrl with streamKey when trailing slash is omitted', () => {
      const dest = adapter.buildRtmpDestination(
        'rtmps://live-upload.instagram.com:443/rtmp',
        'AQB3x9Y_valid_key',
      );
      expect(dest).toBe(
        'rtmps://live-upload.instagram.com:443/rtmp/AQB3x9Y_valid_key',
      );
    });

    it('should not duplicate streamKey if url already ends with the streamKey', () => {
      const dest = adapter.buildRtmpDestination(
        'rtmps://live-upload.instagram.com:443/rtmp/AQB3x9Y_valid_key',
        'AQB3x9Y_valid_key',
      );
      expect(dest).toBe(
        'rtmps://live-upload.instagram.com:443/rtmp/AQB3x9Y_valid_key',
      );
    });
  });

  describe('validateStreamKey', () => {
    it('should accept valid stream keys', () => {
      expect(adapter.validateStreamKey('AQB3x9Y_sample_instagram_live_key')).toBe(true);
      expect(adapter.validateStreamKey('live_sk_1234567890')).toBe(true);
    });

    it('should reject too short or placeholder keys', () => {
      expect(adapter.validateStreamKey('')).toBe(false);
      expect(adapter.validateStreamKey('ab')).toBe(false);
      expect(adapter.validateStreamKey('••••••••••••••••')).toBe(false);
      expect(adapter.validateStreamKey('x-youtube-key-placeholder')).toBe(false);
    });
  });

  describe('createBroadcast', () => {
    it('should throw BadRequestException for unsupported accounts', async () => {
      await expect(
        adapter.createBroadcast('token', 'Test Stream', 'desc', {
          accountType: 'PERSONAL',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stream key is missing in Live Producer mode', async () => {
      await expect(
        adapter.createBroadcast('token', 'Test Stream', 'desc', {
          accountType: 'BUSINESS',
          customStreamUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
          customStreamKey: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ingest URL is invalid or unsafe', async () => {
      await expect(
        adapter.createBroadcast('token', 'Test Stream', 'desc', {
          accountType: 'BUSINESS',
          customStreamUrl: 'rtmp://127.0.0.1/malicious',
          customStreamKey: 'valid_key_12345',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return valid broadcast payload when properly configured', async () => {
      const res = await adapter.createBroadcast('token', 'Live Producer Stream', 'desc', {
        accountType: 'BUSINESS',
        customStreamUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
        customStreamKey: 'AQB3x9Y_valid_key',
      });

      expect(res.platformStreamId).toContain('ig_broadcast_');
      expect(res.streamUrl).toBe('rtmps://live-upload.instagram.com:443/rtmp/');
      expect(res.streamKey).toBe('AQB3x9Y_valid_key');
      expect(res.producerUrl).toBe('https://www.instagram.com/');
    });
  });

  describe('URLs', () => {
    it('should generate correct viewer and producer URLs', async () => {
      expect(adapter.getProducerUrl()).toBe('https://www.instagram.com/');
      expect(adapter.getProfileUrl('nexasocial_official')).toBe(
        'https://www.instagram.com/nexasocial_official/',
      );
      expect(adapter.getProfileUrl('@nexasocial_official')).toBe(
        'https://www.instagram.com/nexasocial_official/',
      );
      expect(adapter.getProfileUrl(null)).toBeNull();
      expect(adapter.getProfileUrl('')).toBeNull();
      expect(await adapter.getViewerUrl('any-id')).toBeNull();
    });
  });

  describe('checkOfficialLiveStatus', () => {
    it('should require manual confirmation when access token is mock or missing', async () => {
      const res = await adapter.checkOfficialLiveStatus('mock_token', 'ig_user_1');
      expect(res.isLive).toBe(false);
      expect(res.requiresManualConfirmation).toBe(true);
      expect(res.apiPublishSupported).toBe(false);
      expect(res.limitationReason).toContain('Live video');
      expect(res.isMockAccount).toBe(true);
    });

    it('should detect live broadcast if Meta live_media edge returns active media', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: 'live_media_123', media_product_type: 'LIVE' }],
        }),
      } as any);

      try {
        const res = await adapter.checkOfficialLiveStatus('real_token', 'ig_user_1');
        expect(res.isLive).toBe(true);
        expect(res.liveMediaId).toBe('live_media_123');
        expect(res.requiresManualConfirmation).toBe(false);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API failure or empty live_media gracefully', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Unsupported request' } }),
      } as any);

      try {
        const res = await adapter.checkOfficialLiveStatus('real_token', 'ig_user_1');
        expect(res.isLive).toBe(false);
        expect(res.requiresManualConfirmation).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
