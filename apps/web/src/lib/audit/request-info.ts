/**
 * リクエスト情報取得ヘルパー
 */
import type { NextRequest } from 'next/server';

/**
 * リクエストからIPアドレスを取得
 */
export function getIpAddress(request: NextRequest): string | undefined {
  // x-forwarded-forヘッダーから取得（プロキシ経由の場合）
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // x-real-ipヘッダーから取得
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 直接接続の場合（開発環境等）
  return undefined;
}

/**
 * リクエストからユーザーエージェントを取得
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
