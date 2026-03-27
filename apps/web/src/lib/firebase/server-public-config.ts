/**
 * Cloud Run 等のサーバー（Route Handler）専用。
 * NEXT_PUBLIC_* は Next.js がビルド時にインライン化するため、Docker ビルドで未設定だと
 * 実行時に Cloud Run の環境変数を足しても process.env が空のままになる。
 * そのため API ルートでは NEXT_PUBLIC_ ではなく FIREBASE_WEB_* を参照する。
 */
export function getFirebaseWebConfigFromEnv(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
} | null {
  const apiKey = (process.env.FIREBASE_WEB_API_KEY ?? '').trim();
  const authDomain = (process.env.FIREBASE_WEB_AUTH_DOMAIN ?? '').trim();
  const projectId = (process.env.FIREBASE_WEB_PROJECT_ID ?? '').trim();
  if (!apiKey || !authDomain || !projectId) {
    return null;
  }
  return { apiKey, authDomain, projectId };
}
