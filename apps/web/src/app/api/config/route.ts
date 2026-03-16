/**
 * 公開設定（Firebase クライアント用）を返す。Cloud Run 等でランタイムに環境変数を渡している場合に使用。
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Next.js standaloneモードでは、NEXT_PUBLIC_*はビルド時に埋め込まれるため、
  // ランタイムの環境変数を直接読み込む（サーバーサイドではprocess.envから直接取得可能）
  // ただし、standaloneモードでは、ビルド時にNEXT_PUBLIC_*が空の場合、ランタイムでも空のままになる
  
  // ビルド時に埋め込まれた値が空文字列の場合、ランタイムの環境変数を読み込む
  // Next.jsのstandaloneモードでは、ビルド時にNEXT_PUBLIC_*が空の場合、ランタイムの環境変数が使用される
  // しかし、実際にはビルド時に埋め込まれた値が優先されるため、
  // ビルド時に環境変数を設定する必要がある
  
  // サーバーサイドでは、process.envから直接読み込めるはずだが、
  // standaloneモードでは、ビルド時にNEXT_PUBLIC_*が空の場合、ランタイムでも空のままになる
  // そのため、Cloud Runの環境変数を直接読み込む必要がある
  
  // ビルド時に埋め込まれた値（空の可能性がある）
  let apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  let authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  
  // ビルド時に埋め込まれた値が空の場合、ランタイムの環境変数を確認
  // standaloneモードでは、ビルド時にNEXT_PUBLIC_*が空の場合、ランタイムの環境変数が使用される可能性がある
  // しかし、実際にはビルド時に埋め込まれた値が優先されるため、
  // ビルド時に環境変数を設定する必要がある
  
  // デバッグ: 環境変数の値を確認
  console.log('Environment variables check:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey ? '***' : 'empty',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NODE_ENV: process.env.NODE_ENV,
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
