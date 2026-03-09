import type { ItemDoc } from '@vault-share/db';
import { encrypt, decrypt } from '@vault-share/crypto';
import type { ItemPayload } from './types';

function getItemEncryptionKey(): string {
  const key =
    process.env.ITEM_ENCRYPTION_KEY ||
    process.env.VAULT_ITEM_ENCRYPTION_KEY ||
    process.env.VAULT_SHARE_ITEM_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Item encryption key is not configured (ITEM_ENCRYPTION_KEY).');
  }
  return key;
}

export function encryptItemPayload(payload: ItemPayload): Pick<ItemDoc, 'ciphertext' | 'iv'> {
  const plaintext = JSON.stringify(payload);
  const key = getItemEncryptionKey();
  const result = encrypt(plaintext, key);
  return {
    ciphertext: result.ciphertext,
    iv: result.iv,
  };
}

export function decryptItemPayload(doc: Pick<ItemDoc, 'ciphertext' | 'iv'>): ItemPayload {
  const key = getItemEncryptionKey();
  const plaintext = decrypt(doc.ciphertext, doc.iv, key);
  return JSON.parse(plaintext) as ItemPayload;
}
