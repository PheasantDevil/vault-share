/**
 * 指定ユーザーがグループのメンバーかどうかを Firestore で確認する。
 *
 * `where('groupId').where('userId')` の複合クエリはインデックス必須のため、
 * `groupId` の単一条件のみで取得し、userId はアプリ側で絞り込む（メンバー数は通常小さい）。
 */
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc } from '@vault-share/db';

export async function getGroupMembership(
  groupId: string,
  userId: string
): Promise<GroupMemberDoc | null> {
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.groupMembers).where('groupId', '==', groupId).get();
  const doc = snap.docs.find((d) => (d.data() as GroupMemberDoc).userId === userId);
  return doc ? (doc.data() as GroupMemberDoc) : null;
}
