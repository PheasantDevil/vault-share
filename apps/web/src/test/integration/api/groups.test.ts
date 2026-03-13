/**
 * グループAPIの統合テスト
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { setupTestEnv, cleanupTestEnv } from '../helpers/setup-test-env';
import { createTestUser, createTestGroup, cleanupTestData } from '../helpers/test-data';
import { createTestHeaders } from '../helpers/auth-helper';
import { GET, POST } from '@/app/api/groups/route';
import { getDb, COLLECTIONS } from '@vault-share/db';

describe('Groups API Integration Tests', () => {
  let testUser: { email: string; password: string; uid: string; displayName?: string };
  let userIds: string[] = [];
  let groupIds: string[] = [];

  beforeAll(async () => {
    await setupTestEnv();
    testUser = await createTestUser('test@example.com', 'password123', 'Test User');
    userIds.push(testUser.uid);
  });

  afterAll(async () => {
    await cleanupTestData(userIds, groupIds);
    await cleanupTestEnv();
  });

  describe('GET /api/groups', () => {
    it('should return empty array when user has no groups', async () => {
      // 別のユーザーでテスト（グループに所属していない）
      const otherUser = await createTestUser('other@example.com', 'password123', 'Other User');
      userIds.push(otherUser.uid);

      const headers = await createTestHeaders(otherUser.uid, otherUser.email);
      const request = new NextRequest('http://localhost:3000/api/groups', {
        headers,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.groups).toEqual([]);
    });

    it('should return user groups', async () => {
      // テストグループを作成
      const group = await createTestGroup('Test Group', testUser.uid);
      groupIds.push(group.id);

      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest('http://localhost:3000/api/groups', {
        headers,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.groups)).toBe(true);
      const userGroups = data.groups.filter((g: { id: string }) => g.id === group.id);
      expect(userGroups.length).toBeGreaterThan(0);
      expect(userGroups[0].name).toBe('Test Group');
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Group' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('New Group');

      if (data.id) {
        groupIds.push(data.id);
      }
    });

    it('should return error when name is missing', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
