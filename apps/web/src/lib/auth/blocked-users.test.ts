import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@vault-share/db', () => ({
  getDb: () => ({
    collection: () => ({
      doc: () => ({
        get: () => mockGet(),
      }),
    }),
  }),
  COLLECTIONS: { blockedUsers: 'blockedUsers' },
}));

import { normalizeEmailForBlocklist, isUserBlocked } from './blocked-users';

describe('blocked-users', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('normalizeEmailForBlocklist', () => {
    expect(normalizeEmailForBlocklist('  A@Example.COM  ')).toBe('a@example.com');
  });

  it('isUserBlocked はドキュメント存在で true', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    await expect(isUserBlocked('x@y.com')).resolves.toBe(true);
  });

  it('isUserBlocked は未登録で false', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    await expect(isUserBlocked('x@y.com')).resolves.toBe(false);
  });
});
