/**
 * グループに紐づく items を Firestore から取得する。
 * `where('groupId')` のみとし複合インデックスを要求しない（並び替えは呼び出し側）。
 */
import { COLLECTIONS } from '@vault-share/db';
import type { Firestore } from 'firebase-admin/firestore';

export async function getItemSnapshotsByGroupId(db: Firestore, groupId: string) {
  return db.collection(COLLECTIONS.items).where('groupId', '==', groupId).get();
}
