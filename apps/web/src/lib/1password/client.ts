/**
 * 1Password Connect API クライアント
 */
import type { Auth } from 'firebase/auth';

export interface OnePasswordVault {
  id: string;
  name: string;
  description?: string;
  attributeVersion: number;
  contentVersion: number;
  createdAt: string;
  updatedAt: string;
  type: 'USER_CREATED' | 'SYSTEM';
}

export interface OnePasswordItem {
  id: string;
  title: string;
  vault: {
    id: string;
  };
  category: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OnePasswordItemDetail extends OnePasswordItem {
  fields?: Array<{
    id: string;
    label?: string;
    type: string;
    value?: string;
    purpose?: string;
  }>;
  sections?: Array<{
    id: string;
    label?: string;
    fields?: Array<{
      id: string;
      label?: string;
      type: string;
      value?: string;
    }>;
  }>;
}

export interface OnePasswordConnectConfig {
  connectUrl: string;
  accessToken: string;
}

/**
 * 1Password Connect API クライアント
 */
export class OnePasswordConnectClient {
  private connectUrl: string;
  private accessToken: string;

  constructor(config: OnePasswordConnectConfig) {
    this.connectUrl = config.connectUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.connectUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1Password Connect API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Vault一覧を取得
   */
  async listVaults(): Promise<OnePasswordVault[]> {
    const response = await this.request<{ vaults: OnePasswordVault[] }>('/v1/vaults');
    return response.vaults;
  }

  /**
   * Vault内のアイテム一覧を取得
   */
  async listItems(vaultId: string): Promise<OnePasswordItem[]> {
    const response = await this.request<{ items: OnePasswordItem[] }>(
      `/v1/vaults/${vaultId}/items`
    );
    return response.items;
  }

  /**
   * アイテム詳細を取得
   */
  async getItem(vaultId: string, itemId: string): Promise<OnePasswordItemDetail> {
    return this.request<OnePasswordItemDetail>(`/v1/vaults/${vaultId}/items/${itemId}`);
  }
}
