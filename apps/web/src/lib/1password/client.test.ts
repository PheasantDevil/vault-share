import { describe, it, expect, vi, afterEach } from 'vitest';
import { OnePasswordConnectClient } from './client';

const sampleVault = {
  id: 'abcd1234efgh5678ijkl9012',
  name: 'Test',
  attributeVersion: 1,
  contentVersion: 1,
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2020-01-01T00:00:00Z',
  type: 'USER_CREATED',
};

describe('OnePasswordConnectClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('listVaults: Connect が配列を返す場合にパースする', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => [sampleVault],
    });

    const client = new OnePasswordConnectClient({
      connectUrl: 'http://127.0.0.1:8080',
      accessToken: 'token',
    });
    const vaults = await client.listVaults();
    expect(vaults).toHaveLength(1);
    expect(vaults[0].name).toBe('Test');
  });

  it('listVaults: { vaults: [] } 形式にも対応する', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => ({ vaults: [sampleVault] }),
    });

    const client = new OnePasswordConnectClient({
      connectUrl: 'http://127.0.0.1:8080',
      accessToken: 'token',
    });
    const vaults = await client.listVaults();
    expect(vaults).toHaveLength(1);
  });

  it('listItems: Connect が配列を返す場合にパースする', async () => {
    const item = {
      id: 'item1234567890123456789012',
      title: 'Login',
      vault: { id: sampleVault.id },
      category: 'LOGIN',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
      version: 1,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => [item],
    });

    const client = new OnePasswordConnectClient({
      connectUrl: 'http://127.0.0.1:8080',
      accessToken: 'token',
    });
    const items = await client.listItems(sampleVault.id);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Login');
  });
});
