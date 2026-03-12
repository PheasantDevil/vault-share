/**
 * 統合テスト環境のセットアップ
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase-admin/firestore';
import { getAuth, connectAuthEmulator } from 'firebase-admin/auth';
import { setDb } from '@vault-share/db';

const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

let isInitialized = false;

export async function setupTestEnv() {
  if (isInitialized) {
    return;
  }

  // Firebase Admin SDKの初期化（エミュレータ用）
  try {
    initializeApp({
      projectId: 'test-project',
      credential: cert({
        projectId: 'test-project',
        clientEmail: 'test@test-project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
      }),
    });
  } catch (err) {
    // 既に初期化されている場合は無視
    if (!(err as Error).message.includes('already been initialized')) {
      throw err;
    }
  }

  // Firestoreエミュレータに接続
  const db = getFirestore();
  const [host, port] = FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, parseInt(port, 10));

  // Authエミュレータに接続
  const auth = getAuth();
  const [authHost, authPort] = AUTH_EMULATOR_HOST.split(':');
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`);

  // DBを設定
  setDb(db);

  isInitialized = true;
}

export async function cleanupTestEnv() {
  // テストデータのクリーンアップは各テストで実施
  // ここでは必要に応じて追加のクリーンアップを実装
}
