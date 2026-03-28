/**
 * GET: 1Password Connect がこの環境で利用可能か（環境変数の有無のみ）
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectUrl = process.env.ONEPASSWORD_CONNECT_URL;
    const accessToken = process.env.ONEPASSWORD_CONNECT_TOKEN;

    if (!connectUrl?.trim() || !accessToken?.trim()) {
      return NextResponse.json({
        available: false,
        reason: 'not_configured' as const,
      });
    }

    return NextResponse.json({ available: true as const });
  } catch (err) {
    console.error('1Password connection-status error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
