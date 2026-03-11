/**
 * GET: MFA状態の取得
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getSessionFromRequest } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const user = await auth.getUser(session.uid);
    const mfaSettings = user.multiFactor;

    const enrolledFactors = mfaSettings?.enrolledFactors || [];

    return NextResponse.json({
      enabled: enrolledFactors.length > 0,
      enrolledFactors: enrolledFactors.map((factor) => ({
        uid: factor.uid,
        displayName: factor.displayName,
        factorId: factor.factorId,
        enrollmentTime: factor.enrollmentTime,
      })),
    });
  } catch (err) {
    console.error('MFA status error:', err);
    return NextResponse.json({ error: 'MFA状態の取得に失敗しました' }, { status: 500 });
  }
}
