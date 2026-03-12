import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, getSessionCookieName } from '@/lib/auth/session';

const PROTECTED_PREFIX = '/dashboard';
// セッションタイムアウト（30分）
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set(cookieName, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
    return res;
  }

  // セッションタイムアウトチェック
  const now = Date.now();
  const sessionAge = now - (payload.exp * 1000 - 7 * 24 * 60 * 60 * 1000); // セッション作成時刻を推定
  if (sessionAge > SESSION_TIMEOUT_MS) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set(cookieName, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
