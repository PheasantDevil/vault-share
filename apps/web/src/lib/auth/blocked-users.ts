/**
 * Firestore `blockedUsers` によるログイン拒否（ブラックリスト）
 */
import { getDb, COLLECTIONS } from '@vault-share/db';

export function normalizeEmailForBlocklist(email: string): string {
  return email.trim().toLowerCase();
}

export async function isUserBlocked(email: string): Promise<boolean> {
  const normalized = normalizeEmailForBlocklist(email);
  if (!normalized) return false;
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.blockedUsers).doc(normalized).get();
  return snap.exists;
}
