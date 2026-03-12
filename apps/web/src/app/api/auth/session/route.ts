/**
 * POST: ID トークンでセッション発行。許可リストチェック・User 作成/更新・Cookie セット。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { UserDoc } from '@vault-share/db';
import { getAdminAuth } from '@/lib/firebase/admin';
import { isEmailAllowed } from '@/lib/auth/allowed-emails';
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from '@/lib/auth/session';
import { checkRateLimit, createRateLimitResponse, createUserRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（IPアドレスベース、1分間に5回まで）
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 1000, // 1分
      maxRequests: 5,
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const body = await request.json();
    const idToken = typeof body.idToken === 'string' ? body.idToken : null;
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const email = (decoded.email ?? '').trim().toLowerCase();
    const uid = decoded.uid;

    if (!email || !isEmailAllowed(email)) {
      return NextResponse.json({ error: 'このメールアドレスは利用できません。' }, { status: 403 });
    }

    // MFA状態を取得
    const user = await auth.getUser(uid);
    const mfaSettings = user.multiFactor;
    const mfaEnabled = (mfaSettings?.enrolledFactors?.length ?? 0) > 0;

    const now = new Date().toISOString();
    const userDoc: UserDoc = {
      uid,
      email: decoded.email ?? undefined,
      displayName: (decoded.name as string) ?? undefined,
      mfaEnabled,
      createdAt: now,
      updatedAt: now,
    };

    const db = getDb();
    const userRef = db.collection(COLLECTIONS.users).doc(uid);
    const existing = await userRef.get();
    if (existing.exists) {
      await userRef.update({
        email: userDoc.email,
        displayName: userDoc.displayName,
        mfaEnabled: userDoc.mfaEnabled,
        updatedAt: now,
      });
    } else {
      await userRef.set(userDoc);
    }

    const token = await createSessionToken({ uid, email });
    const res = NextResponse.json({ ok: true });
    const opts = getSessionCookieOptions();
    res.cookies.set(getSessionCookieName(), token, opts);
    return res;
  } catch (err) {
    console.error('Session creation error:', err);
    return NextResponse.json({ error: 'ログインに失敗しました。' }, { status: 500 });
  }
}
