/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as crypto from 'crypto';

const CBC_ALGORITHM = 'aes-256-cbc';
const GCM_ALGORITHM = 'aes-256-gcm';
const CBC_IV_LENGTH = 16;
const GCM_IV_LENGTH = 12; // 96 bits recommended for GCM

function getEncryptionKey(): Buffer {
  const rawKey =
    process.env.ENCRYPTION_SECRET_KEY ||
    process.env.ENCRYPTION_KEY ||
    'default_nexasocial_oauth_encryption_secret_key_32_bytes_fallback';
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypt using legacy AES-256-CBC for OAuth token compatibility.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(CBC_IV_LENGTH);
  const cipher = crypto.createCipheriv(CBC_ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Authenticated AES-256-GCM encryption for stream keys, credentials, and sensitive configuration.
 * Format: gcm:<ivHex>:<authTagHex>:<cipherHex>
 */
export function encryptGcm(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(GCM_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Authenticated AES-256-GCM decryption.
 */
export function decryptGcm(text: string): string {
  if (!text) return '';
  if (!text.startsWith('gcm:')) {
    return decrypt(text);
  }

  const parts = text.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid GCM payload format');
  }

  const [, ivHex, tagHex, cipherHex] = parts;
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error('Invalid GCM payload components');
  }

  if (cipherHex.length % 2 !== 0 || ivHex.length % 2 !== 0 || tagHex.length % 2 !== 0) {
    throw new Error('Invalid hex encoding in GCM payload');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(GCM_ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Decrypts text encrypted with either AES-256-GCM (starts with 'gcm:') or legacy AES-256-CBC.
 */
export function decrypt(text: string): string {
  if (!text) return '';
  if (text.startsWith('gcm:')) {
    return decryptGcm(text);
  }

  try {
    const parts = text.split(':');
    if (parts.length < 2) return text; // Plaintext fallback
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(CBC_ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    throw new Error(`Token decryption failed: ${err.message}`);
  }
}

/**
 * High-level encryption alias for sensitive secrets (stream keys).
 */
export const encryptSecret = encryptGcm;
export const decryptSecret = decryptGcm;
