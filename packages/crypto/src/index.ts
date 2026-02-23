/**
 * Application-level encryption for item payloads.
 * AES-256-GCM. Key must be provided by caller (e.g. from Secret Manager).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 32;

export interface EncryptResult {
  ciphertext: string; // base64
  iv: string; // base64
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * @param plaintext UTF-8 string (e.g. JSON stringified payload)
 * @param keyBase64 Raw key as 32-byte Buffer or base64 string
 */
export function encrypt(plaintext: string, key: Buffer | string): EncryptResult {
  const keyBuf = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
  if (keyBuf.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes`);
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, tag]);
  return {
    ciphertext: combined.toString('base64'),
    iv: iv.toString('base64'),
  };
}

/**
 * Decrypt ciphertext with AES-256-GCM.
 */
export function decrypt(ciphertextBase64: string, ivBase64: string, key: Buffer | string): string {
  const keyBuf = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
  if (keyBuf.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes`);
  }
  const iv = Buffer.from(ivBase64, 'base64');
  const combined = Buffer.from(ciphertextBase64, 'base64');
  const tag = combined.subarray(-TAG_LENGTH);
  const encrypted = combined.subarray(0, -TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, keyBuf, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Derive a 32-byte key from a secret (e.g. from Secret Manager) and optional salt.
 * Use when the stored secret is a passphrase rather than a raw 32-byte key.
 */
export function deriveKey(secret: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
  const saltBuf = salt ?? randomBytes(SALT_LENGTH);
  const key = scryptSync(secret, saltBuf, KEY_LENGTH, { N: 16384, r: 8, p: 1 });
  return { key, salt: saltBuf };
}
