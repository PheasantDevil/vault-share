/**
 * リクエストからセッションを取得（API ルート用）
 */
import type { NextRequest } from 'next/server';
import { verifySessionToken, getSessionCookieName } from './session';
import type { SessionPayload } from './session';

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
