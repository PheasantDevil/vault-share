/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Next.js standaloneモードでは、NEXT_PUBLIC_*はビルド時に埋め込まれるため、
  // ビルド時に空の場合、ランタイムでも空のままになる
  // そのため、サーバーサイドではprocess.envから直接読み込む必要がある
  
  // ビルド時に埋め込まれた値（空の可能性がある）
  let apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  let authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  
  // デバッグ: すべての環境変数を確認（本番環境でのトラブルシューティング用）
  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('FIREBASE') || key.includes('NEXT_PUBLIC')
  );
  console.log('Environment variables check:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey ? '***' : 'empty',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NODE_ENV: process.env.NODE_ENV,
    allFirebaseEnvKeys: allEnvKeys,
    // 実際の値（マスク済み）を確認
    apiKeyLength: apiKey.length,
    authDomainLength: authDomain.length,
    projectIdLength: projectId.length,
    // すべてのprocess.envのキーを確認（デバッグ用）
    allEnvKeysSample: Object.keys(process.env).slice(0, 20),
  });
  
  apiKey = apiKey.trim();
  authDomain = authDomain.trim();
  projectId = projectId.trim();

  // API Keyが設定されていない場合、エラーを返す
  if (!apiKey || apiKey === '') {
    // デバッグ情報をログに出力（本番環境でのトラブルシューティング用）
    console.error('Firebase API Key is not configured. Environment variables:', {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***' : 'undefined',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NODE_ENV: process.env.NODE_ENV,
    });
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
