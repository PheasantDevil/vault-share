/**
 * 統合テストの globalSetup: エミュレータに接続できない場合はテストを実行せず exit 0 する
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

export default async function globalSetup() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: 'test-project' });
  }

  try {
    const auth = getAuth();
    await auth.listUsers(1);
    return;
  } catch (err) {
    const isNetworkError =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === 'app/network-error';
    if (isNetworkError) {
      console.warn('Firebase Emulators に接続できません。統合テストをスキップします。');
      console.warn('  実行するには: firebase emulators:start --only firestore,auth');
      console.warn('  または: pnpm run test:integration:with-emulators（要 Java）');
      process.exit(0);
    }
    throw err;
  }
}
