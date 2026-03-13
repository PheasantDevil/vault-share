'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';

type Group = { id: string; name: string };
type Member = { userId: string; role: 'owner' | 'member'; displayName?: string; email?: string };
type ItemSummary = { id: string; title: string; type: string; updatedAt: string };
type ItemDetail = {
  id: string;
  payload: {
    title: string;
    type: string;
    value: string;
    note?: string;
  };
  updatedAt: string;
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<'password' | 'note' | 'key' | 'other'>('password');
  const [itemValue, setItemValue] = useState('');
  const [itemNote, setItemNote] = useState('');
  const [itemFilter, setItemFilter] = useState<'all' | 'password' | 'note' | 'key' | 'other'>(
    'all'
  );
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  const [itemsLoading, setItemsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/groups/${id}/members`).then((r) => r.json()),
      loadItemsPage(1),
    ])
      .then(([gRes, mRes, iRes]) => {
        if (gRes.error) throw new Error(gRes.error);
        setGroup(gRes);
        setEditName(gRes.name);
        setMembers(mRes.members ?? []);
        if (iRes.items) {
          setItems(iRes.items);
          setTotalItems(iRes.pagination?.total ?? 0);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'エラー'))
      .finally(() => setLoading(false));
  }, [id]);

  async function loadItemsPage(page: number) {
    if (!id) return { items: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
    setItemsLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      if (itemSearchQuery.trim()) {
        params.append('search', itemSearchQuery.trim());
      }
      if (itemFilter !== 'all') {
        params.append('type', itemFilter);
      }
      const res = await fetch(`/api/groups/${id}/items?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'アイテムの取得に失敗しました');
      }
      setItems(data.items ?? []);
      setTotalItems(data.pagination?.total ?? 0);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラー';
      setError(errorMessage);
      toast.showToast('error', errorMessage);
      return { items: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    setCurrentPage(1); // 検索・フィルタ変更時は最初のページに戻す
    loadItemsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSearchQuery, itemFilter, id]);

  useEffect(() => {
    if (!id) return;
    loadItemsPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, id]);

  async function reloadItems() {
    await loadItemsPage(currentPage);
  }

  async function createInvite() {
    try {
      const res = await fetch(`/api/groups/${id}/invitations`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '招待リンクの作成に失敗');
      setInviteLink(data.inviteLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
    }
  }

  async function updateGroup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '更新に失敗');
      setGroup((g) => (g ? { ...g, name: editName.trim() } : null));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
    }
  }

  async function deleteGroup() {
    if (!confirm('このグループを削除しますか？')) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '削除に失敗');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
    }
  }

  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/groups/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: itemTitle.trim(),
          type: itemType,
          value: itemValue,
          note: itemNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'アイテムの作成に失敗しました');
      }
      setItemTitle('');
      setItemType('password');
      setItemValue('');
      setItemNote('');
      setItemFormOpen(false);
      toast.showToast('success', 'アイテムを作成しました');
      await reloadItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラー';
      setError(errorMessage);
      toast.showToast('error', errorMessage);
    }
  }

  async function loadItemDetail(itemId: string) {
    setItemLoading(true);
    setSelectedItem(null);
    try {
      const res = await fetch(`/api/groups/${id}/items/${itemId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'アイテムの取得に失敗しました');
      setSelectedItem({
        id: data.id,
        payload: data.payload,
        updatedAt: data.updatedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
    } finally {
      setItemLoading(false);
    }
  }

  if (loading) {
    return (
      <PageLayout title="読み込み中..." maxWidth={720} backLink={{ href: '/dashboard', label: 'ダッシュボード' }}>
        <p>読み込み中...</p>
      </PageLayout>
    );
  }
  if (error || !group) {
    return (
      <PageLayout title="エラー" maxWidth={720} backLink={{ href: '/dashboard', label: 'ダッシュボード' }}>
        <Alert type="error">{error ?? 'グループが見つかりません'}</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={group.name} maxWidth={720} backLink={{ href: '/dashboard', label: 'ダッシュボード' }}>
      {error && <Alert type="error">{error}</Alert>}
      {editing ? (
        <form onSubmit={updateGroup} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <FormField
              label="グループ名"
              id="group-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              style={{ flex: 1, marginBottom: 0 }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Button type="submit" variant="primary">
                保存
              </Button>
              <Button type="button" onClick={() => setEditing(false)} variant="secondary">
                キャンセル
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Button type="button" onClick={() => setEditing(true)} variant="secondary">
            編集
          </Button>
          <Button type="button" onClick={deleteGroup} variant="danger">
            削除
          </Button>
        </div>
      )}
      <SectionHeader title="メンバー" />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {members.map((m) => (
          <li key={m.userId} style={{ marginBottom: '0.25rem' }}>
            <span>
              {m.displayName || m.email || m.userId}{' '}
              {m.role === 'owner' ? '(オーナー)' : '(メンバー)'}
            </span>
            {/* メンバー管理: とりあえず全員にボタンを表示し、権限はサーバー側でチェック */}
            <span style={{ marginLeft: '0.5rem' }}>
              {m.role === 'owner' ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/groups/${id}/members`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: m.userId, role: 'member' }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(data.error ?? 'ロールの更新に失敗しました');
                      }
                      setMembers((prev) =>
                        prev.map((x) => (x.userId === m.userId ? { ...x, role: 'member' } : x))
                      );
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'エラー');
                    }
                  }}
                  style={{ marginRight: 4 }}
                >
                  メンバーにする
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/groups/${id}/members`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: m.userId, role: 'owner' }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(data.error ?? 'ロールの更新に失敗しました');
                      }
                      setMembers((prev) =>
                        prev.map((x) => (x.userId === m.userId ? { ...x, role: 'owner' } : x))
                      );
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'エラー');
                    }
                  }}
                  style={{ marginRight: 4 }}
                >
                  オーナーにする
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('このメンバーをグループから削除しますか？')) return;
                  try {
                    const res = await fetch(`/api/groups/${id}/members`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: m.userId }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data.error ?? 'メンバーの削除に失敗しました');
                    }
                    setMembers((prev) => prev.filter((x) => x.userId !== m.userId));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'エラー');
                  }
                }}
              >
                削除
              </button>
            </span>
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>招待</h2>
      {inviteLink ? (
        <p>
          招待リンク: <a href={inviteLink}>{inviteLink}</a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            style={{ marginLeft: 0.5 }}
          >
            コピー
          </button>
        </p>
      ) : (
        <button type="button" onClick={createInvite}>
          招待リンクを発行
        </button>
      )}
      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>アイテム</h2>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link href={`/dashboard/groups/${id}/1password`}>1Passwordからインポート</Link>
        <span>|</span>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setError(null);
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`/api/groups/${id}/import`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error ?? 'CSVインポートに失敗しました');
                }
                await reloadItems();
                alert(`${data.count}件のアイテムをインポートしました`);
                // ファイル入力のリセット
                e.target.value = '';
              } catch (err) {
                setError(err instanceof Error ? err.message : 'エラー');
              }
            }}
          />
          <span style={{ textDecoration: 'underline', color: 'blue' }}>CSVからインポート</span>
        </label>
        <span>|</span>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept=".1pux,application/json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setError(null);
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`/api/groups/${id}/import-1pux`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error ?? '1PUXインポートに失敗しました');
                }
                await reloadItems();
                alert(`${data.count}件のアイテムをインポートしました`);
                // ファイル入力のリセット
                e.target.value = '';
              } catch (err) {
                setError(err instanceof Error ? err.message : 'エラー');
              }
            }}
          />
          <span style={{ textDecoration: 'underline', color: 'blue' }}>1PUXからインポート</span>
        </label>
        <span>|</span>
        <button
          type="button"
          onClick={async () => {
            try {
              setError(null);
              const res = await fetch(`/api/groups/${id}/export`);
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'CSVエクスポートに失敗しました');
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vault-share-export-${id}-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'エラー');
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            color: 'blue',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          CSVにエクスポート
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={async () => {
            try {
              setError(null);
              const res = await fetch(`/api/groups/${id}/export-1pux`);
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? '1PUXエクスポートに失敗しました');
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vault-share-export-${id}-${new Date().toISOString().split('T')[0]}.1pux`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'エラー');
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            color: 'blue',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          1PUXにエクスポート
        </button>
      </div>
      <div
        style={{
          marginBottom: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <label>
          検索:
          <input
            type="text"
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            placeholder="タイトルで検索"
            style={{ marginLeft: '0.25rem', padding: '0.25rem', width: '200px' }}
          />
        </label>
        <label>
          フィルタ:
          <select
            value={itemFilter}
            onChange={(e) =>
              setItemFilter(e.target.value as 'all' | 'password' | 'note' | 'key' | 'other')
            }
            style={{ marginLeft: '0.25rem', padding: '0.25rem' }}
          >
            <option value="all">すべて</option>
            <option value="password">パスワード</option>
            <option value="note">メモ</option>
            <option value="key">キー</option>
            <option value="other">その他</option>
          </select>
        </label>
        <button type="button" onClick={() => setItemFormOpen((v) => !v)}>
          {itemFormOpen ? 'アイテム作成フォームを閉じる' : '新しいアイテムを追加'}
        </button>
      </div>
      {itemFormOpen && (
        <form onSubmit={submitItem} style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              タイトル
              <input
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                required
                style={{ display: 'block', width: '100%', padding: 0.5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              種別
              <select
                value={itemType}
                onChange={(e) =>
                  setItemType(e.target.value as 'password' | 'note' | 'key' | 'other')
                }
                style={{ display: 'block', padding: 0.5 }}
              >
                <option value="password">パスワード</option>
                <option value="note">メモ</option>
                <option value="key">キー</option>
                <option value="other">その他</option>
              </select>
            </label>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              内容
              <textarea
                value={itemValue}
                onChange={(e) => setItemValue(e.target.value)}
                required
                rows={4}
                style={{ display: 'block', width: '100%', padding: 0.5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              補足メモ（任意）
              <textarea
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                rows={3}
                style={{ display: 'block', width: '100%', padding: 0.5 }}
              />
            </label>
          </div>
          <button type="submit" style={{ marginRight: 0.5 }}>
            保存
          </button>
          <button type="button" onClick={() => setItemFormOpen(false)} style={{ marginLeft: 0.5 }}>
            キャンセル
          </button>
        </form>
      )}
      {itemsLoading ? (
        <SkeletonLoader rows={5} height="2rem" />
      ) : items.length === 0 ? (
        <p>
          {totalItems === 0
            ? 'まだアイテムはありません。'
            : '検索条件・フィルタに一致するアイテムがありません。'}
        </p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
            {items.map((it) => (
              <li key={it.id} style={{ marginBottom: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => loadItemDetail(it.id)}
                  style={{ textAlign: 'left', width: '100%', padding: 0.5 }}
                >
                  <strong>{it.title}</strong> <span style={{ marginLeft: 4 }}>({it.type})</span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </>
      )}
      {itemLoading && <p>アイテムを読み込み中...</p>}
      {selectedItem && (
        <section
          aria-label="選択中のアイテム"
          style={{
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: 4,
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{selectedItem.payload.title}</h3>
          <p style={{ marginBottom: '0.5rem' }}>
            種別: <code>{selectedItem.payload.type}</code>
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            値:
            <span
              style={{
                display: 'inline-block',
                marginLeft: 4,
                padding: '0.25rem 0.5rem',
                background: '#f5f5f5',
                wordBreak: 'break-all',
              }}
            >
              {selectedItem.payload.value}
            </span>
          </p>
          {selectedItem.payload.note && (
            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.payload.note}</p>
          )}
        </section>
      )}
    </PageLayout>
  );
}
