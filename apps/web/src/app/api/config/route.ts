/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

  return NextResponse.json(
    {
      firebase: { apiKey, authDomain, projectId },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
