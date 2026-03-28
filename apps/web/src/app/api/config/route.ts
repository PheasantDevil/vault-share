/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';
import { getFirebaseWebConfigFromEnv } from '@/lib/firebase/server-public-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  // NEXT_PUBLIC_* はビルド時インライン化されるため、本番では FIREBASE_WEB_* を参照する。
  const cfg = getFirebaseWebConfigFromEnv();

  if (!cfg) {
    const missing: string[] = [];
    if (!(process.env.FIREBASE_WEB_API_KEY ?? '').trim()) missing.push('FIREBASE_WEB_API_KEY');
    if (!(process.env.FIREBASE_WEB_AUTH_DOMAIN ?? '').trim())
      missing.push('FIREBASE_WEB_AUTH_DOMAIN');
    if (!(process.env.FIREBASE_WEB_PROJECT_ID ?? '').trim())
      missing.push('FIREBASE_WEB_PROJECT_ID');

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

  const { apiKey, authDomain, projectId } = cfg;

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
