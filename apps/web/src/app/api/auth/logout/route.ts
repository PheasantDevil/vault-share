/**
 * POST: セッション Cookie を削除してログアウト
 */
import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });
  return res;
}
