/**
 * ログイン成功後の遷移先。オープンリダイレクトを防ぐため、相対パス（同一アプリ内）のみ許可。
 */
const DUMMY_ORIGIN = 'http://dummy.local';

export function getSafePostLoginPath(from: string | null | undefined): string {
  if (from == null || typeof from !== 'string') return '/dashboard';
  const t = from.trim();
  if (!t) return '/dashboard';
  try {
    const u = new URL(t, DUMMY_ORIGIN);
    if (u.origin !== DUMMY_ORIGIN) return '/dashboard';
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path || '/dashboard';
  } catch {
    return '/dashboard';
  }
}
