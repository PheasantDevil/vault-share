/**
 * 統合テスト環境のセットアップ
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { setDb } from '@vault-share/db';

const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

let isInitialized = false;

export async function setupTestEnv() {
  if (isInitialized) {
    return;
  }

  // 環境変数を設定（Firebase Admin SDKは環境変数から自動的にエミュレーターに接続）
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
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

  // Firestoreエミュレータに接続（環境変数により自動接続）
  const db = getFirestore();

  // Authエミュレータに接続（環境変数により自動接続）
  const auth = getAuth();

  // DBを設定
  setDb(db);

  isInitialized = true;
}

export async function cleanupTestEnv() {
  // テストデータのクリーンアップは各テストで実施
  // ここでは必要に応じて追加のクリーンアップを実装
}
