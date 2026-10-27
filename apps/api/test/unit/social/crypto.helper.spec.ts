import {
  encrypt,
  decrypt,
  encryptGcm,
  decryptGcm,
} from '../../../src/social/utils/crypto.helper';

describe('CryptoHelper (Unit) - AES-256-GCM & Legacy Compatibility', () => {
  const originalSecretKey = process.env.ENCRYPTION_SECRET_KEY;

  beforeAll(() => {
    process.env.ENCRYPTION_SECRET_KEY =
      'test_super_secure_encryption_key_32_bytes_len!';
  });

  afterAll(() => {
    process.env.ENCRYPTION_SECRET_KEY = originalSecretKey;
  });

  describe('encryptGcm & decryptGcm', () => {
    it('should encrypt with authenticated AES-256-GCM and format as gcm:iv:tag:cipher', () => {
      const plaintext = 'AQB3x9Y_instagram_live_super_secret_stream_key';
      const encrypted = encryptGcm(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.startsWith('gcm:')).toBe(true);

      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('gcm');
      // IV is 12 bytes = 24 hex chars
      expect(parts[1]).toHaveLength(24);
      // Tag is 16 bytes = 32 hex chars
      expect(parts[2]).toHaveLength(32);
      // Ciphertext length > 0
      expect(parts[3].length).toBeGreaterThan(0);
    });

    it('should decrypt GCM encrypted payload back to identical plaintext', () => {
      const secret = 'live_sk_my_instagram_secret_stream_key_12345';
      const cipher = encryptGcm(secret);
      const decrypted = decryptGcm(cipher);
      expect(decrypted).toBe(secret);
    });

    it('should reject tampered ciphertext with authentication error', () => {
      const cipher = encryptGcm('sensitive_stream_key');
      const parts = cipher.split(':');
      // Tamper ciphertext
      parts[3] = parts[3].slice(0, -2) + 'aa';
      const tampered = parts.join(':');

      expect(() => decryptGcm(tampered)).toThrow();
    });

    it('should reject tampered authentication tag', () => {
      const cipher = encryptGcm('sensitive_stream_key');
      const parts = cipher.split(':');
      // Tamper tag
      parts[2] = '0'.repeat(32);
      const tampered = parts.join(':');

      expect(() => decryptGcm(tampered)).toThrow();
    });
  });

  describe('unified decrypt (backward compatibility)', () => {
    it('should automatically decrypt GCM string via decrypt()', () => {
      const text = 'my-new-instagram-gcm-key';
      const encrypted = encryptGcm(text);
      expect(decrypt(encrypted)).toBe(text);
    });

    it('should decrypt legacy AES-256-CBC token via decrypt()', () => {
      const legacyToken = 'legacy-oauth-access-token-12345';
      const encryptedLegacy = encrypt(legacyToken); // uses CBC
      expect(encryptedLegacy.startsWith('gcm:')).toBe(false);
      expect(encryptedLegacy).toContain(':');

      const decrypted = decrypt(encryptedLegacy);
      expect(decrypted).toBe(legacyToken);
    });

    it('should return empty string for empty inputs', () => {
      expect(encryptGcm('')).toBe('');
      expect(decryptGcm('')).toBe('');
      expect(decrypt('')).toBe('');
    });
  });
});
