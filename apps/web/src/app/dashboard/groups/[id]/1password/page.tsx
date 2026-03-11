'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [vaults, setVaults] = useState<OnePasswordVault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [items, setItems] = useState<OnePasswordItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadVaults();
  }, []);

  useEffect(() => {
    if (selectedVaultId) {
      loadItems(selectedVaultId);
    } else {
      setItems([]);
      setSelectedItems(new Set());
    }
  }, [selectedVaultId]);

  async function loadVaults() {
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
  }

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

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>1Passwordからインポート</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        <Link href={`/dashboard/groups/${groupId}`}>← グループ詳細</Link>
      </p>

      {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}

      {loading && <p>読み込み中...</p>}

      {!loading && vaults.length === 0 && (
        <p>1Password Connect設定がありません。管理者に連絡してください。</p>
      )}

      {!loading && vaults.length > 0 && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Vaultを選択:
              <select
                value={selectedVaultId || ''}
                onChange={(e) => setSelectedVaultId(e.target.value || null)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
              >
                <option value="">選択してください</option>
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedVaultId && items.length > 0 && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <p>インポートするアイテムを選択してください:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {items.map((item) => (
                    <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span>
                          {item.title} ({item.category})
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedItems.size > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {importing ? 'インポート中...' : `${selectedItems.size}件をインポート`}
                  </button>
                </div>
              )}
            </>
          )}

          {selectedVaultId && items.length === 0 && !loading && (
            <p>このVaultにはアイテムがありません。</p>
          )}
        </>
      )}
    </main>
  );
}
