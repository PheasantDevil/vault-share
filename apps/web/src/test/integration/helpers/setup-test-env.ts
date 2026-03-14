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
  // エミュレーター用には有効な形式のモックキーを使用
  if (getApps().length === 0) {
    initializeApp({
      projectId: 'test-project',
      credential: cert({
        projectId: 'test-project',
        clientEmail: 'test@test-project.iam.gserviceaccount.com',
        // エミュレーター用の有効な形式のモックキー（最小限の有効なPEM形式）
        privateKey:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1+f4dSxqOPcs5wTop3S7x2eol0CbmB5Z+U6xHvV5+8z5Q5\nQ5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q\n5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q\nAgMBAAECggEBAK8+8v5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q\n5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q\n5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q\nECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v\nMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5f\nYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6P\nkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/\nv8HCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v\n8PHy8/T19vf4+fr7/P3+/wIDAQAB\n-----END PRIVATE KEY-----',
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
