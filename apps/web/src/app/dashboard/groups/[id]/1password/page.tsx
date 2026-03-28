'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { CsvImportGuidance } from '@/components/onepassword-import/CsvImportGuidance';
import { useOnePasswordConnectionStatus } from '@/lib/swr/hooks';
import { ItemImportFilters } from './ItemImportFilters';
import { ItemImportList } from './ItemImportList';
import { filterImportItems } from './filter-items';

type OnePasswordVault = {
  id: string;
  name: string;
  description?: string;
};

type OnePasswordItem = {
  id: string;
  title: string;
  vault: { id: string };
  category: string;
};

export default function OnePasswordImportPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <OnePasswordImportContent />
    </Suspense>
  );
}

function OnePasswordImportContent() {
  const params = useParams();
  const router = useRouter();
  const groupId = typeof params.id === 'string' ? params.id : '';
  const {
    available: connectAvailable,
    isLoading: connectStatusLoading,
    isError: connectStatusError,
  } = useOnePasswordConnectionStatus();
  const [vaults, setVaults] = useState<OnePasswordVault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [items, setItems] = useState<OnePasswordItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const loadVaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/1password/vaults');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Vault一覧の取得に失敗しました');
        return;
      }
      setVaults(data.vaults || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vault一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connectAvailable !== true) {
      return;
    }
    void loadVaults();
  }, [connectAvailable, loadVaults]);

  useEffect(() => {
    if (selectedVaultId) {
      loadItems(selectedVaultId);
    } else {
      setItems([]);
      setSelectedItems(new Set());
    }
    setSearchQuery('');
    setCategoryFilter('');
  }, [selectedVaultId]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category?.trim()) {
        set.add(item.category);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [items]);

  const filteredItems = useMemo(
    () => filterImportItems(items, searchQuery, categoryFilter),
    [items, searchQuery, categoryFilter]
  );

  async function loadItems(vaultId: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/1password/vaults/${vaultId}/items`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'アイテム一覧の取得に失敗しました');
        return;
      }
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アイテム一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function toggleItemSelection(itemId: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  }

  function handleToggleAllVisible() {
    const visibleIds = filteredItems.map((i) => i.id);
    if (visibleIds.length === 0) {
      return;
    }
    const allSelected = visibleIds.every((id) => selectedItems.has(id));
    const next = new Set(selectedItems);
    if (allSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelectedItems(next);
  }

  async function handleImport() {
    if (selectedItems.size === 0 || !selectedVaultId) {
      setError('インポートするアイテムを選択してください');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      // 選択したアイテムを順次インポート
      for (const itemId of selectedItems) {
        const res = await fetch(`/api/1password/vaults/${selectedVaultId}/items/${itemId}`);
        const itemData = await res.json();
        if (!res.ok) {
          console.error(`Failed to fetch item ${itemId}:`, itemData.error);
          continue;
        }

        const item = itemData.item;
        // アイテムを当サービスの形式に変換して登録
        const title = item.title || 'Untitled';
        const type = mapCategoryToType(item.category);
        const value = extractItemValue(item);
        const note = extractItemNote(item);

        const importRes = await fetch(`/api/groups/${groupId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, type, value, note }),
        });

        if (!importRes.ok) {
          console.error(`Failed to import item ${itemId}`);
        }
      }

      // インポート完了後、グループ詳細ページに戻る
      router.push(`/dashboard/groups/${groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました');
    } finally {
      setImporting(false);
    }
  }

  function mapCategoryToType(category: string): 'password' | 'note' | 'key' | 'other' {
    switch (category.toLowerCase()) {
      case 'login':
      case 'password':
        return 'password';
      case 'secure note':
      case 'note':
        return 'note';
      case 'api credential':
      case 'api key':
        return 'key';
      default:
        return 'other';
    }
  }

  function extractItemValue(item: any): string {
    // 1Passwordアイテムから主要な値を抽出
    if (item.fields) {
      const passwordField = item.fields.find(
        (f: any) => f.purpose === 'PASSWORD' || f.label?.toLowerCase() === 'password'
      );
      if (passwordField?.value) return passwordField.value;

      const usernameField = item.fields.find(
        (f: any) => f.purpose === 'USERNAME' || f.label?.toLowerCase() === 'username'
      );
      if (usernameField?.value) return usernameField.value;

      // 最初のフィールドの値を返す
      const firstField = item.fields.find((f: any) => f.value);
      if (firstField?.value) return firstField.value;
    }
    return '';
  }

  function extractItemNote(item: any): string {
    const notes: string[] = [];
    if (item.fields) {
      item.fields.forEach((f: any) => {
        if (f.type === 'STRING' && f.purpose !== 'PASSWORD' && f.purpose !== 'USERNAME') {
          if (f.label && f.value) {
            notes.push(`${f.label}: ${f.value}`);
          }
        }
      });
    }
    if (item.sections) {
      item.sections.forEach((section: any) => {
        if (section.label) notes.push(`\n${section.label}:`);
        if (section.fields) {
          section.fields.forEach((f: any) => {
            if (f.label && f.value) {
              notes.push(`  ${f.label}: ${f.value}`);
            }
          });
        }
      });
    }
    return notes.join('\n');
  }

  const choiceHref = `/dashboard/groups/${groupId}/import/1password`;

  if (connectStatusLoading) {
    return (
      <PageLayout
        title="1Passwordからインポート"
        description="接続状態を確認しています"
        maxWidth={720}
        backLink={{ href: `/dashboard/groups/${groupId}`, label: 'グループ詳細' }}
      >
        <p>読み込み中...</p>
      </PageLayout>
    );
  }

  if (connectStatusError) {
    return (
      <PageLayout
        title="1Passwordからインポート"
        description="1Password Connect からアイテムをインポートします"
        maxWidth={720}
        backLink={{ href: `/dashboard/groups/${groupId}`, label: 'グループ詳細' }}
      >
        <Alert type="error">
          1Password Connect の利用可否を確認できませんでした。ネットワークを確認するか、しばらくしてから再度お試しください。
        </Alert>
        <CsvImportGuidance groupId={groupId} />
        <p style={{ marginTop: '1rem' }}>
          <Link href={choiceHref}>インポート方法の選択に戻る</Link>
        </p>
      </PageLayout>
    );
  }

  if (connectAvailable === false) {
    return (
      <PageLayout
        title="1Passwordからインポート"
        description="この環境では 1Password Connect は利用できません"
        maxWidth={720}
        backLink={{ href: `/dashboard/groups/${groupId}`, label: 'グループ詳細' }}
      >
        <Alert type="info">
          この環境では 1Password Connect が設定されていません。1Password から CSV をエクスポートし、グループ詳細の「CSVからインポート」で取り込んでください。
        </Alert>
        <CsvImportGuidance groupId={groupId} showAdminHints />
        <p style={{ marginTop: '1rem' }}>
          <Link href={choiceHref}>インポート方法の選択に戻る</Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="1Passwordからインポート"
      description="1Password Connectからアイテムをインポートします"
      maxWidth={720}
      backLink={{ href: `/dashboard/groups/${groupId}`, label: 'グループ詳細' }}
    >
      {error && (
        <>
          <Alert type="error">{error}</Alert>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <Link href={choiceHref}>インポート方法の選択に戻る（CSV など）</Link>
          </p>
        </>
      )}

      {loading && <p>読み込み中...</p>}

      {!loading && !error && vaults.length === 0 && (
        <Alert type="warning">
          利用可能な Vault がありません。1Password で Vault を作成するか、Connect
          のアクセストークンが正しいアカウントを指しているか確認してください。
        </Alert>
      )}

      {!loading && vaults.length > 0 && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="vault-select"
              style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Vaultを選択
            </label>
            <select
              id="vault-select"
              value={selectedVaultId || ''}
              onChange={(e) => setSelectedVaultId(e.target.value || null)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
              }}
            >
              <option value="">選択してください</option>
              {vaults.map((vault) => (
                <option key={vault.id} value={vault.id}>
                  {vault.name}
                </option>
              ))}
            </select>
            <p
              style={{
                color: 'var(--muted, #666)',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                marginBottom: 0,
              }}
            >
              インポート元のVaultを選択してください
            </p>
          </div>

          {selectedVaultId && items.length > 0 && (
            <>
              <ItemImportFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                categories={categoryOptions}
              />
              <ItemImportList
                filteredItems={filteredItems}
                totalCount={items.length}
                selectedIds={selectedItems}
                onToggle={toggleItemSelection}
                onToggleAllVisible={handleToggleAllVisible}
              />

              {selectedItems.size > 0 && (
                <div>
                  <Button
                    type="button"
                    onClick={handleImport}
                    loading={importing}
                    variant="primary"
                  >
                    {selectedItems.size}件をインポート
                  </Button>
                </div>
              )}
            </>
          )}

          {selectedVaultId && items.length === 0 && !loading && (
            <Alert type="info">このVaultにはアイテムがありません。</Alert>
          )}
        </>
      )}
    </PageLayout>
  );
}
