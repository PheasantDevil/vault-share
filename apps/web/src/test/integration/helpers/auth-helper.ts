/**
 * 認証ヘルパー（統合テスト用）
 */
import { SignJWT } from 'jose';
import { getSessionCookieName } from '@/lib/auth/session';

const SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-key-for-integration-tests-min-16-chars';

/**
 * テスト用のセッションCookieを生成
 */
export async function createTestSessionCookie(uid: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(SESSION_SECRET);
  const token = await new SignJWT({
    uid,
    email: email ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const cookieName = getSessionCookieName();
  return `${cookieName}=${token}`;
}

/**
 * テスト用のリクエストヘッダーを生成
 */
export async function createTestHeaders(uid: string, email: string): Promise<Headers> {
  const cookie = await createTestSessionCookie(uid, email);
  return new Headers({
    Cookie: cookie,
  });
}
