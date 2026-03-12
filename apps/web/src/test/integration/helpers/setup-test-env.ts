/**
 * 統合テスト環境のセットアップ
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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
  if (getApps().length === 0) {
    initializeApp({
      projectId: 'test-project',
      credential: cert({
        projectId: 'test-project',
        clientEmail: 'test@test-project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
      }),
    });
  }

  // Firestoreエミュレータに接続
  const db = getFirestore();
  try {
    const [host, port] = FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, parseInt(port, 10));
  } catch (err) {
    // 既に接続されている場合は無視
    if (!(err as Error).message.includes('already connected')) {
      throw err;
    }
  }

  // Authエミュレータに接続
  const auth = getAuth();
  try {
    const [authHost, authPort] = AUTH_EMULATOR_HOST.split(':');
    connectAuthEmulator(auth, `http://${authHost}:${authPort}`);
  } catch (err) {
    // 既に接続されている場合は無視
    if (!(err as Error).message.includes('already connected')) {
      throw err;
    }
  }

  // DBを設定
  setDb(db);

  isInitialized = true;
}

export async function cleanupTestEnv() {
  // テストデータのクリーンアップは各テストで実施
  // ここでは必要に応じて追加のクリーンアップを実装
}
