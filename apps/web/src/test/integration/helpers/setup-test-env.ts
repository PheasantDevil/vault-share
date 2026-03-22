/**
 * 統合テスト環境のセットアップ
 */
import { setDb } from '@vault-share/db';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

/** 32-byte AES key (base64). 統合テスト専用。本番は ITEM_ENCRYPTION_KEY を必ず別値で設定すること。 */
const DEFAULT_INTEGRATION_ITEM_ENCRYPTION_KEY = 'QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=';

let isInitialized = false;

export async function setupTestEnv() {
  if (isInitialized) {
    return;
  }

  // アイテム暗号化（@vault-share/crypto は 32 バイトの base64 キーを要求）
  if (!process.env.ITEM_ENCRYPTION_KEY) {
    process.env.ITEM_ENCRYPTION_KEY = DEFAULT_INTEGRATION_ITEM_ENCRYPTION_KEY;
  }

  // 環境変数を設定（Firebase Admin SDKは環境変数から自動的にエミュレーターに接続）
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
  }

  // Firebase Admin SDKの初期化（エミュレータ用）
  // エミュレーター用にはcredentialを指定しない（環境変数から自動接続）
  if (getApps().length === 0) {
    initializeApp({
      projectId: 'test-project',
    });
  }

  // Firestoreエミュレータに接続（環境変数により自動接続）
  const db = getFirestore();

  // Authエミュレータに接続（環境変数により自動接続）
  const auth = getAuth();

  // エミュレータへの接続確認（未起動時は分かりやすいエラーを出す）
  try {
    await auth.listUsers(1);
  } catch (err) {
    const msg =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === 'app/network-error'
        ? 'Firebase Emulators に接続できません。別ターミナルで "firebase emulators:start --only firestore,auth" を実行してから再度テストを実行してください。'
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(`統合テストのセットアップに失敗しました: ${msg}`);
  }

  // DBを設定
  setDb(db);

  isInitialized = true;
}

export async function cleanupTestEnv() {
  // テストデータのクリーンアップは各テストで実施
  // ここでは必要に応じて追加のクリーンアップを実装
}
