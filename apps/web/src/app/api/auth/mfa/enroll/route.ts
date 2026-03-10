/**
 * POST: MFA登録を開始（TOTP）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getSessionFromRequest } from '@/lib/auth/get-session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const user = await auth.getUser(session.uid);

    // MFAセッションを開始
    const multiFactorSession = await auth.generateMultiFactorEnrollmentToken(user.uid, {
      factorId: 'totp',
    });

    // TOTPのシークレットを生成（実際の実装では、QRコードのURLも生成する必要があります）
    // ここでは簡易的にセッションIDを返します
    return NextResponse.json({
      sessionId: multiFactorSession,
      // 実際の実装では、QRコードのURLも返す必要があります
    });
  } catch (err) {
    console.error('MFA enroll error:', err);
    return NextResponse.json({ error: 'MFA登録の開始に失敗しました' }, { status: 500 });
  }
}
