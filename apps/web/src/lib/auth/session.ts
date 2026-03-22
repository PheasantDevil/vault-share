/**
 * セッション JWT の作成・検証（Cookie 用・サーバー専用）
 */
import * as jose from 'jose';

const COOKIE_NAME = 'vault-share-session';
const EXPIRY = '7d';

export type SessionPayload = {
  uid: string;
  email: string | null;
  exp: number;
};

export function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET must be set and at least 16 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const secret = getSessionSecret();
  return await new jose.SignJWT({
    uid: payload.uid,
    email: payload.email ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    const uid = payload.uid as string;
    const email = (payload.email as string | null) ?? null;
    if (!uid) return null;
    return { uid, email, exp: (payload.exp ?? 0) as number };
  } catch (_err) {
    return null;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

function useSecureSessionCookie(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === 'false') return false;
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  // 本番は HTTPS 想定で Secure。E2E 等で NODE_ENV=production かつ http://localhost のときは SESSION_COOKIE_SECURE=false を設定すること。
  return process.env.NODE_ENV === 'production';
}

export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: useSecureSessionCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
