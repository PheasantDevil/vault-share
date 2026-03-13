/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

  // API Keyが設定されていない場合、エラーを返す
  if (!apiKey || apiKey.trim() === '') {
    return NextResponse.json(
      {
        error: 'Firebase API Key is not configured',
        message: 'NEXT_PUBLIC_FIREBASE_API_KEY environment variable is not set in Cloud Run.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

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
