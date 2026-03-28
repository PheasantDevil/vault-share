/**
 * SWRカスタムフック
 */
import useSWR from 'swr';
import type { GroupDoc, ItemDoc } from '@vault-share/db';

interface GroupsResponse {
  groups: GroupDoc[];
}

interface GroupResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type OnePasswordConnectionStatus =
  | { available: true }
  | { available: false; reason: 'not_configured' };

interface ItemsResponse {
  items: Array<{
    id: string;
    title: string;
    type: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * フェッチャー関数
 */
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
}

/**
 * グループ一覧を取得するフック
 */
export function useGroups() {
  const { data, error, isLoading, mutate } = useSWR<GroupsResponse>('/api/groups', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  return {
    groups: data?.groups || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * グループ詳細を取得するフック
 */
export function useGroup(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<GroupResponse>(
    groupId ? `/api/groups/${groupId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    group: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * アイテム一覧を取得するフック
 */
/**
 * 1Password Connect が環境で利用可能か（URL / トークン設定の有無）
 */
export function useOnePasswordConnectionStatus() {
  const { data, error, isLoading, mutate } = useSWR<OnePasswordConnectionStatus>(
    '/api/1password/connection-status',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    }
  );

  return {
    available: data?.available,
    reason: data && 'reason' in data ? data.reason : undefined,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}

export function useItems(
  groupId: string | null,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
  }
) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.search) params.append('search', options.search);
  if (options?.type) params.append('type', options.type);

  const url = groupId
    ? `/api/groups/${groupId}/items${params.toString() ? `?${params.toString()}` : ''}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<ItemsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  return {
    items: data?.items || [],
    pagination: data?.pagination || {
      total: 0,
      limit: 0,
      offset: 0,
      hasMore: false,
    },
    isLoading,
    isError: error,
    mutate,
  };
}
