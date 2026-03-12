/**
 * レート制限ユーティリティ（Firestoreベース）
 */
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { NextRequest } from 'next/server';
import { getIpAddress } from '@/lib/audit/request-info';

export interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  keyGenerator?: (request: NextRequest) => string; // キー生成関数
}

interface RateLimitDoc {
  key: string;
  count: number;
  resetAt: string; // ISO 8601
  createdAt: string;
}

const RATE_LIMIT_COLLECTION = 'rateLimits';

/**
 * デフォルトのキー生成関数（IPアドレスベース）
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip = getIpAddress(request) || 'unknown';
  return `ip:${ip}`;
}

/**
 * レート制限チェック
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const db = getDb();
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);

  // 既存のレート制限レコードを取得
  const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(key);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    // 新規作成
    const newDoc: RateLimitDoc = {
      key,
      count: 1,
      resetAt: resetAt.toISOString(),
      createdAt: now.toISOString(),
    };
    await docRef.set(newDoc);

    // TTL設定（Firestoreの自動削除用、実際のTTLはCloud Functions等で設定）
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  const existing = docSnap.data() as RateLimitDoc;
  const resetTime = new Date(existing.resetAt);

  // リセット時間を過ぎている場合はリセット
  if (now >= resetTime) {
    const newDoc: RateLimitDoc = {
      key,
      count: 1,
      resetAt: resetAt.toISOString(),
      createdAt: now.toISOString(),
    };
    await docRef.set(newDoc);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // カウントを増やす
  const newCount = existing.count + 1;
  await docRef.update({ count: newCount });

  if (newCount > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    resetAt,
  };
}

/**
 * ユーザーIDベースのレート制限
 */
export function createUserRateLimitKey(userId: string, action: string): string {
  return `user:${userId}:${action}`;
}

/**
 * レート制限エラーレスポンスを生成
 */
export function createRateLimitResponse(resetAt: Date): Response {
  const resetTimestamp = Math.floor(resetAt.getTime() / 1000);
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
        resetAt: resetAt.toISOString(),
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': resetTimestamp.toString(),
        'X-RateLimit-Reset': resetTimestamp.toString(),
      },
    }
  );
}
