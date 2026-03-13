/**
 * Firebase クライアント初期化（ブラウザのみ。Identity Platform のメール/パスワード認証用）
 * ビルド時に NEXT_PUBLIC_* が無い場合、/api/config からランタイムで取得する。
 */
import type { FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

const buildTimeConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function hasConfig(c: { apiKey?: string; authDomain?: string; projectId?: string }) {
  return !!(c.apiKey && c.authDomain && c.projectId);
}

function getFirebaseAppSync(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0] as FirebaseApp;
  }
  return initializeApp(buildTimeConfig as Record<string, string>);
}

/** 同期的に Auth を返す（ビルド時に NEXT_PUBLIC_* が設定されている場合のみ正常動作） */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseAppSync());
}

let configFetched: Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
} | null> | null = null;

async function fetchRuntimeConfig(): Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
} | null> {
  if (configFetched !== null) return configFetched;
  configFetched = (async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) {
        console.error('Failed to fetch Firebase config:', res.status, res.statusText);
        return null;
      }
      const data = await res.json();
      const f = data?.firebase;
      if (f && f.apiKey && f.authDomain && f.projectId) {
        // API Keyが空文字列でないことを確認
        if (f.apiKey.trim() === '') {
          console.error('Firebase API Key is empty');
          return null;
        }
        return f;
      }
      console.error('Invalid Firebase config:', f);
    } catch (err) {
      console.error('Error fetching Firebase config:', err);
    }
    return null;
  })();
  return configFetched;
}

/**
 * Auth を取得する。ビルド時設定が無い場合は /api/config から取得してから初期化する。
 * サインアップ・ログインではこちらを使用すること（Cloud Run のランタイム環境変数に対応）。
 */
export async function getFirebaseAuthAsync(): Promise<Auth> {
  const apps = getApps();
  if (apps.length > 0) {
    return getAuth(apps[0] as FirebaseApp);
  }
  if (hasConfig(buildTimeConfig)) {
    // ビルド時設定のAPI Keyが空でないことを確認
    if (!buildTimeConfig.apiKey || buildTimeConfig.apiKey.trim() === '') {
      throw new Error(
        'Firebase API Key is not configured. Please set NEXT_PUBLIC_FIREBASE_API_KEY environment variable.'
      );
    }
    return getAuth(getFirebaseAppSync());
  }
  if (typeof window === 'undefined') {
    return getAuth(getFirebaseAppSync());
  }
  const runtime = await fetchRuntimeConfig();
  if (runtime) {
    const app = initializeApp(runtime);
    return getAuth(app);
  }
  // ランタイム設定も取得できない場合、エラーを投げる
  throw new Error(
    'Firebase configuration is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in Cloud Run environment variables.'
  );
}
