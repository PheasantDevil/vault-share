/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Next.js standaloneモードでは NEXT_PUBLIC_* がビルド時に埋め込まれるが、
  // Cloud Run のランタイム環境変数と一致しない場合に空になることがある。
  // サーバーサイドでは process.env を直接参照してバリデーションする。

  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
  const authDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim();
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();

  const missing: string[] = [];
  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');

  if (missing.length > 0) {
    // 失敗理由をレスポンス本文に出し過ぎず、ただし何が欠けているかはログに残す
    console.error('Firebase config missing in Cloud Run:', { missing });
    return NextResponse.json(
      {
        error: 'Firebase configuration is missing',
        message: 'Cloud Run の環境変数の Firebase 設定が不足しています。',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const buildSha = (process.env.BUILD_SHA ?? '').trim();

  return NextResponse.json(
    {
      firebase: { apiKey, authDomain, projectId },
      /** 本番イメージがどの Git コミットか（Docker --build-arg BUILD_SHA）。ローカルでは空のことが多い */
      ...(buildSha ? { buildSha } : {}),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
