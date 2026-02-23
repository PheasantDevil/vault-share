/**
 * Firestore client and collection paths.
 * Encryption is applied at application layer; this layer stores ciphertext + metadata.
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

export const COLLECTIONS = {
  users: 'users',
  groups: 'groups',
  groupMembers: 'groupMembers',
  invitations: 'invitations',
  items: 'items',
} as const;

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    const { initializeApp, getApps } = require('firebase-admin/app');
    if (!getApps().length) {
      initializeApp();
    }
    _db = getFirestore();
  }
  return _db;
}

export function setDb(db: Firestore): void {
  _db = db;
}

export type { Firestore };
