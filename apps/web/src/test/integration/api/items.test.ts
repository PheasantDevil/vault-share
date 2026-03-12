/**
 * アイテムAPIの統合テスト
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { setupTestEnv, cleanupTestEnv } from '../helpers/setup-test-env';
import { createTestUser, createTestGroup, cleanupTestData } from '../helpers/test-data';
import { createTestHeaders } from '../helpers/auth-helper';
import { GET, POST } from '@/app/api/groups/[id]/items/route';
import { encryptItemPayload } from '@/lib/items/encryption';

describe('Items API Integration Tests', () => {
  let testUser: { email: string; password: string; uid: string; displayName?: string };
  let testGroup: { id: string; name: string; createdBy: string };
  let userIds: string[] = [];
  let groupIds: string[] = [];

  beforeAll(async () => {
    await setupTestEnv();
    testUser = await createTestUser('test@example.com', 'password123', 'Test User');
    userIds.push(testUser.uid);
    testGroup = await createTestGroup('Test Group', testUser.uid);
    groupIds.push(testGroup.id);
  });

  afterAll(async () => {
    await cleanupTestData(userIds, groupIds);
    await cleanupTestEnv();
  });

  describe('GET /api/groups/[id]/items', () => {
    it('should return empty array when group has no items', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest(`http://localhost:3000/api/groups/${testGroup.id}/items`, {
        headers,
      });

      const response = await GET(request, { params: { id: testGroup.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(0);
    });

    it('should return items with pagination', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      
      // アイテムを作成
      const createRequest = new NextRequest(`http://localhost:3000/api/groups/${testGroup.id}/items`, {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Item',
          type: 'password',
          value: 'test-value',
        }),
      });
      await POST(createRequest, { params: { id: testGroup.id } });

      // アイテム一覧を取得
      const listRequest = new NextRequest(
        `http://localhost:3000/api/groups/${testGroup.id}/items?limit=10&offset=0`,
        { headers }
      );
      const response = await GET(listRequest, { params: { id: testGroup.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toBe('Test Item');
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('POST /api/groups/[id]/items', () => {
    it('should create a new item', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest(`http://localhost:3000/api/groups/${testGroup.id}/items`, {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Item',
          type: 'password',
          value: 'password123',
          note: 'Test note',
        }),
      });

      const response = await POST(request, { params: { id: testGroup.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.title).toBe('New Item');
      expect(data.type).toBe('password');
    });

    it('should return error when title is missing', async () => {
      const headers = await createTestHeaders(testUser.uid, testUser.email);
      const request = new NextRequest(`http://localhost:3000/api/groups/${testGroup.id}/items`, {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          value: 'password123',
        }),
      });

      const response = await POST(request, { params: { id: testGroup.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
    });
  });
});
