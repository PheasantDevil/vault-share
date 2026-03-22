/**
 * vault-share-dev（または GOOGLE_CLOUD_PROJECT）の Firestore から
 * 「グループ関連」トップレベルコレクションの全ドキュメントを削除する。
 *
 * 削除対象: items, groupMembers, invitations, auditLogs, groups
 * 残す: users, rateLimits など
 *
 * 前提:
 *   gcloud auth application-default login
 *   export GOOGLE_CLOUD_PROJECT=vault-share-dev
 *
 * 実行:
 *   cd apps/web && pnpm run clear:firestore-group-data
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const COLLECTIONS_TO_CLEAR = [
  'items',
  'groupMembers',
  'invitations',
  'auditLogs',
  'groups',
] as const;

async function deleteAllInCollection(db: Firestore, collectionId: string): Promise<number> {
  const ref = db.collection(collectionId);
  let deleted = 0;
  // orderBy __name__ で安定してページング（大量件数対応）
  let finished = false;
  while (!finished) {
    const snap = await ref.orderBy('__name__').limit(500).get();
    if (snap.empty) {
      finished = true;
      break;
    }
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snap.size;
    if (snap.size < 500) finished = true;
  }
  return deleted;
}

async function main() {
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId?.trim()) {
    console.error('GOOGLE_CLOUD_PROJECT（または GCLOUD_PROJECT）を設定してください。');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: projectId.trim() });
  }
  const db = getFirestore();

  console.log(`Project: ${projectId}`);
  console.log('削除するコレクション:', COLLECTIONS_TO_CLEAR.join(', '));
  console.log('---');

  for (const name of COLLECTIONS_TO_CLEAR) {
    const n = await deleteAllInCollection(db, name);
    console.log(`${name}: ${n} 件削除`);
  }

  console.log('---');
  console.log('完了');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
