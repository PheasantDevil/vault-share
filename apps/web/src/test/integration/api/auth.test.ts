/**
 * 認証APIの統合テスト
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { setupTestEnv, cleanupTestEnv } from '../helpers/setup-test-env';
import { createTestUser, cleanupTestData } from '../helpers/test-data';
import { POST as SessionPOST } from '@/app/api/auth/session/route';
import { POST as LogoutPOST } from '@/app/api/auth/logout/route';

describe('Auth API Integration Tests', () => {
  let testUser: { email: string; password: string; uid: string; displayName?: string };
  let userIds: string[] = [];

  beforeAll(async () => {
    await setupTestEnv();
    testUser = await createTestUser('test@example.com', 'password123', 'Test User');
    userIds.push(testUser.uid);
  });

  afterAll(async () => {
    await cleanupTestData(userIds, []);
    await cleanupTestEnv();
  });

  describe('POST /api/auth/session', () => {
    it('should return error for invalid token', async () => {
      // 注意: エミュレータ環境では、カスタムトークンからIDトークンへの変換が必要です
      // 実際のテストでは、Firebase Client SDKを使用してカスタムトークンからIDトークンを取得する必要があります
      // このテストはE2Eテストで実装する方が適切です
      
      // ここでは基本的な構造のみをテスト
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'invalid-token' }),
      });

      const response = await SessionPOST(request);
      
      // 無効なトークンの場合はエラーが返されることを確認
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear session cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await LogoutPOST(request);

      expect(response.status).toBe(200);
      const cookies = response.headers.getSetCookie();
      expect(cookies.length).toBeGreaterThan(0);
    });
  });
});
