/**
 * Firebase クライアント初期化（ブラウザのみ。Identity Platform のメール/パスワード認証用）
 */
import type { FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function getFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0] as FirebaseApp;
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
