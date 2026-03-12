/**
 * テストデータの生成ヘルパー
 */
import { getAuth } from 'firebase-admin/auth';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { UserDoc, GroupDoc, GroupMemberDoc } from '@vault-share/db';

export interface TestUser {
  email: string;
  password: string;
  uid: string;
  displayName?: string;
}

export interface TestGroup {
  id: string;
  name: string;
  createdBy: string;
}

/**
 * テスト用ユーザーを作成
 */
export async function createTestUser(
  email: string,
  password: string,
  displayName?: string
): Promise<TestUser> {
  const auth = getAuth();
  const user = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });

  // FirestoreにUserDocを作成
  const db = getDb();
  const userDoc: UserDoc = {
    id: user.uid,
    email: user.email || email,
    displayName: displayName || null,
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.collection(COLLECTIONS.users).doc(user.uid).set(userDoc);

  return {
    email,
    password,
    uid: user.uid,
    displayName,
  };
}

/**
 * テスト用グループを作成
 */
export async function createTestGroup(
  name: string,
  createdBy: string
): Promise<TestGroup> {
  const db = getDb();
  const groupRef = db.collection(COLLECTIONS.groups).doc();
  const now = new Date().toISOString();
  const groupDoc: GroupDoc = {
    id: groupRef.id,
    name,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
  await groupRef.set(groupDoc);

  // オーナーとしてメンバーを追加
  const memberDoc: GroupMemberDoc = {
    groupId: groupRef.id,
    userId: createdBy,
    role: 'owner',
    joinedAt: now,
  };
  await db.collection(COLLECTIONS.groupMembers).add(memberDoc);

  return {
    id: groupRef.id,
    name,
    createdBy,
  };
}

/**
 * テスト用IDトークンを生成
 */
export async function createIdToken(uid: string): Promise<string> {
  const auth = getAuth();
  const customToken = await auth.createCustomToken(uid);
  
  // カスタムトークンをIDトークンに変換（エミュレータでは簡略化）
  // 実際の実装では、Firebase Client SDKを使用してカスタムトークンからIDトークンを取得
  // ここではモックとしてカスタムトークンを返す
  return customToken;
}

/**
 * テストデータをクリーンアップ
 */
export async function cleanupTestData(userIds: string[], groupIds: string[]) {
  const db = getDb();
  const auth = getAuth();

  // グループとメンバーを削除
  for (const groupId of groupIds) {
    // メンバーを削除
    const membersSnap = await db
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', groupId)
      .get();
    for (const doc of membersSnap.docs) {
      await doc.ref.delete();
    }

    // グループを削除
    await db.collection(COLLECTIONS.groups).doc(groupId).delete();
  }

  // ユーザーを削除
  for (const uid of userIds) {
    try {
      await auth.deleteUser(uid);
      await db.collection(COLLECTIONS.users).doc(uid).delete();
    } catch (err) {
      // ユーザーが存在しない場合は無視
    }
  }
}
