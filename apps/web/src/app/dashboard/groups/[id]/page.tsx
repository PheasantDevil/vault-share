'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { useOnePasswordConnectionStatus } from '@/lib/swr/hooks';
import type { DetailTemplateId, ItemPayload, ItemType } from '@/lib/items/types';
import {
  STRUCTURED_TEMPLATES,
  getTemplateDefinition,
  initialEmptyFieldsForTemplate,
} from '@/lib/items/template-definitions';
import {
  type EditFormState,
  editFormStateToRequestBody,
  itemPayloadToEditFormState,
} from '@/lib/items/payload-edit';

type Group = { id: string; name: string; myRole?: 'owner' | 'member' };
type Member = { userId: string; role: 'owner' | 'member'; displayName?: string; email?: string };
type ItemSummary = {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  subtitle?: string;
};
type ItemDetail = {
  id: string;
  payload: ItemPayload;
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
  const [itemDetailTemplate, setItemDetailTemplate] = useState<DetailTemplateId>('login');
  const [itemDetailFields, setItemDetailFields] = useState<Record<string, string>>(() =>
    initialEmptyFieldsForTemplate('login')
  );
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
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const toast = useToast();
  const { available: connectAvailable, isLoading: connectHintLoading } =
    useOnePasswordConnectionStatus();

  useEffect(() => {
    if (typeof window === 'undefined' || !id || loading) return;
    if (window.location.hash !== '#csv-import') return;
    const timer = window.setTimeout(() => {
      document.getElementById('csv-import')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [id, loading]);

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
  }, [itemSearchQuery, itemFilter, id]);

  useEffect(() => {
    if (!id) return;
    loadItemsPage(currentPage);
  }, [currentPage, id]);

  async function reloadItems() {
    await loadItemsPage(currentPage);
  }

  /** メンバー操作後に myRole 等をサーバーと一致させる（自己降格・削除時の UI ずれ防止） */
  async function refreshGroupFromApi() {
    if (!id) return;
    try {
      const res = await fetch(`/api/groups/${id}`);
      const data = await res.json();
      if (res.status === 403) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'グループ情報の取得に失敗しました'
        );
      }
      setGroup(data);
      setEditName(data.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラー');
    }
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

  function resetItemForm() {
    setItemTitle('');
    setItemDetailTemplate('login');
    setItemDetailFields(initialEmptyFieldsForTemplate('login'));
    setItemType('password');
    setItemValue('');
    setItemNote('');
  }

  function handleItemTemplateChange(next: DetailTemplateId) {
    setItemDetailTemplate(next);
    if (next !== 'generic') {
      setItemDetailFields(
        initialEmptyFieldsForTemplate(next as 'login' | 'credit_card' | 'bank_account')
      );
    }
  }

  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body =
        itemDetailTemplate !== 'generic'
          ? {
              title: itemTitle.trim(),
              note: itemNote.trim() || undefined,
              detailTemplate: itemDetailTemplate as 'login' | 'credit_card' | 'bank_account',
              detailFields: itemDetailFields,
            }
          : {
              title: itemTitle.trim(),
              type: itemType,
              value: itemValue,
              note: itemNote.trim() || undefined,
            };
      const res = await fetch(`/api/groups/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'アイテムの作成に失敗しました');
      }
      resetItemForm();
      setItemFormOpen(false);
      toast.showToast('success', 'アイテムを作成しました');
      await reloadItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラー';
      setError(errorMessage);
      toast.showToast('error', errorMessage);
    }
  }

  async function submitEditItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || !editForm) return;
    try {
      const body = editFormStateToRequestBody(editForm);
      const res = await fetch(`/api/groups/${id}/items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '更新に失敗しました');
      }
      setEditForm(null);
      toast.showToast('success', 'アイテムを更新しました');
      await loadItemDetail(selectedItem.id);
      await reloadItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラー';
      setError(errorMessage);
      toast.showToast('error', errorMessage);
    }
  }

  async function loadItemDetail(itemId: string) {
    setEditForm(null);
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
      <PageLayout
        title="グループ"
        description="読み込み中です。"
        maxWidth={960}
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      >
        <SkeletonLoader rows={8} height="2.5rem" />
      </PageLayout>
    );
  }
  if (error || !group) {
    return (
      <PageLayout
        title="エラー"
        maxWidth={960}
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      >
        <Alert type="error">{error ?? 'グループが見つかりません'}</Alert>
      </PageLayout>
    );
  }

  const isOwner = group.myRole === 'owner';

  return (
    <PageLayout
      title={group.name}
      description={
        isOwner
          ? 'オーナーとしてグループ名の編集・メンバー管理・招待ができます。'
          : 'メンバーとして共有アイテムの閲覧・編集ができます。'
      }
      maxWidth={960}
      backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
    >
      {error && <Alert type="error">{error}</Alert>}

      <div className="audit-page group-detail-page">
        <section className="audit-panel" aria-labelledby="group-overview-heading">
          <h2 id="group-overview-heading" className="audit-panel__title">
            グループ
          </h2>
          <div className="group-meta">
            <span
              className={`group-role-badge ${isOwner ? 'group-role-badge--owner' : 'group-role-badge--member'}`}
            >
              {isOwner ? 'オーナー' : 'メンバー'}
            </span>
            {isOwner && !editing && (
              <div className="group-actions">
                <Button type="button" onClick={() => setEditing(true)} variant="secondary">
                  編集
                </Button>
                <Button type="button" onClick={deleteGroup} variant="danger">
                  削除
                </Button>
              </div>
            )}
          </div>
          {isOwner && editing && (
            <form onSubmit={updateGroup} className="group-form-stack" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <FormField
                  label="グループ名"
                  id="group-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ flex: '1 1 12rem', marginBottom: 0, minWidth: 0 }}
                />
                <div className="group-form-actions" style={{ marginTop: '1.5rem' }}>
                  <Button type="submit" variant="primary">
                    保存
                  </Button>
                  <Button type="button" onClick={() => setEditing(false)} variant="secondary">
                    キャンセル
                  </Button>
                </div>
              </div>
            </form>
          )}
        </section>

        <section className="audit-panel" aria-labelledby="group-members-heading">
          <h2 id="group-members-heading" className="audit-panel__title">
            メンバー
          </h2>
          <ul className="group-member-list">
            {members.map((m) => (
              <li key={m.userId} className="group-member-row">
                <div className="group-member-row__main">
                  <div className="group-member-row__name">
                    {m.displayName || m.email || m.userId}
                  </div>
                  <div className="group-member-row__role">
                    {m.role === 'owner' ? 'オーナー' : 'メンバー'}
                  </div>
                </div>
                {isOwner ? (
                  <div className="group-member-actions">
                    {m.role === 'owner' ? (
                      <button
                        type="button"
                        className="app-btn app-btn--secondary"
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
                            await refreshGroupFromApi();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'エラー');
                          }
                        }}
                      >
                        メンバーにする
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="app-btn app-btn--secondary"
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
                            await refreshGroupFromApi();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'エラー');
                          }
                        }}
                      >
                        オーナーにする
                      </button>
                    )}
                    <button
                      type="button"
                      className="app-btn app-btn--secondary"
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
                          await refreshGroupFromApi();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'エラー');
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {isOwner ? (
          <section className="audit-panel" aria-labelledby="group-invite-heading">
            <h2 id="group-invite-heading" className="audit-panel__title">
              招待
            </h2>
            {inviteLink ? (
              <div className="group-invite-box">
                <p style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                  招待リンク
                </p>
                <a href={inviteLink}>{inviteLink}</a>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                  >
                    コピー
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="primary" onClick={createInvite}>
                招待リンクを発行
              </Button>
            )}
          </section>
        ) : null}

        <section className="audit-panel" aria-labelledby="group-items-heading">
          <h2 id="group-items-heading" className="audit-panel__title">
            アイテム
          </h2>
          {!connectHintLoading && connectAvailable === false && (
            <p className="group-hint audit-panel__hint">
              この環境では 1Password Connect が未設定のため、Connect
              経由の取り込みはできません。1Passwordからインポートを開くと CSV への案内があります。
            </p>
          )}
          <div className="group-impex" id="csv-import">
            <span className="group-impex__label">取り込み・書き出し</span>
            <div className="group-impex__actions">
              <Link href={`/dashboard/groups/${id}/import/1password`}>1Passwordからインポート</Link>
              <span className="group-impex__sep" aria-hidden>|</span>
              <label>
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
                      e.target.value = '';
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'エラー');
                    }
                  }}
                />
                <span className="group-impex-file">CSVからインポート</span>
              </label>
              <span className="group-impex__sep" aria-hidden>|</span>
              <label>
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
                      e.target.value = '';
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'エラー');
                    }
                  }}
                />
                <span className="group-impex-file">1PUXからインポート</span>
              </label>
              <span className="group-impex__sep" aria-hidden>|</span>
              <button
                type="button"
                className="app-btn app-btn--ghost"
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
              >
                CSVにエクスポート
              </button>
              <span className="group-impex__sep" aria-hidden>|</span>
              <button
                type="button"
                className="app-btn app-btn--ghost"
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
              >
                1PUXにエクスポート
              </button>
            </div>
          </div>
          <div className="group-filter-bar">
            <div className="audit-field">
              <label htmlFor="group-item-search">検索</label>
              <input
                id="group-item-search"
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="タイトル・内容で検索"
                autoComplete="off"
              />
            </div>
            <div className="audit-field">
              <label htmlFor="group-item-filter">フィルタ</label>
              <select
                id="group-item-filter"
                value={itemFilter}
                onChange={(e) =>
                  setItemFilter(e.target.value as 'all' | 'password' | 'note' | 'key' | 'other')
                }
              >
                <option value="all">すべて</option>
                <option value="password">パスワード</option>
                <option value="note">メモ</option>
                <option value="key">キー</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div
              className="audit-field"
              style={{ flex: '0 0 auto', minWidth: 'auto', alignSelf: 'flex-end' }}
            >
              <Button type="button" variant="secondary" onClick={() => setItemFormOpen((v) => !v)}>
                {itemFormOpen ? '作成フォームを閉じる' : '新しいアイテムを追加'}
              </Button>
            </div>
          </div>
          {itemFormOpen && (
            <form onSubmit={submitItem} className="group-form-stack">
              <div>
                <label htmlFor="new-item-title">タイトル</label>
                <input
                  id="new-item-title"
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="new-item-template">テンプレート</label>
                <select
                  id="new-item-template"
                  value={itemDetailTemplate}
                  onChange={(e) => handleItemTemplateChange(e.target.value as DetailTemplateId)}
                >
                  {STRUCTURED_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                  <option value="generic">汎用（従来どおり）</option>
                </select>
                <p className="audit-panel__hint" style={{ marginTop: 'var(--spacing-xs)' }}>
                  1Password
                  のログイン・カード・口座などに近い入力欄です。汎用では従来の「種別＋内容」です。
                </p>
              </div>
              {itemDetailTemplate !== 'generic' &&
                getTemplateDefinition(
                  itemDetailTemplate as 'login' | 'credit_card' | 'bank_account'
                )?.fields.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`new-item-field-${f.key}`}>{f.label}</label>
                    {f.input === 'textarea' ? (
                      <textarea
                        id={`new-item-field-${f.key}`}
                        value={itemDetailFields[f.key] ?? ''}
                        onChange={(e) =>
                          setItemDetailFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                        }
                        rows={3}
                      />
                    ) : (
                      <input
                        id={`new-item-field-${f.key}`}
                        type={f.input === 'password' ? 'password' : 'text'}
                        value={itemDetailFields[f.key] ?? ''}
                        onChange={(e) =>
                          setItemDetailFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                        }
                        autoComplete="off"
                      />
                    )}
                  </div>
                ))}
              {itemDetailTemplate === 'generic' && (
                <>
                  <div>
                    <label htmlFor="new-item-type">種別</label>
                    <select
                      id="new-item-type"
                      value={itemType}
                      onChange={(e) =>
                        setItemType(e.target.value as 'password' | 'note' | 'key' | 'other')
                      }
                    >
                      <option value="password">パスワード</option>
                      <option value="note">メモ</option>
                      <option value="key">キー</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-item-value">内容</label>
                    <textarea
                      id="new-item-value"
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="new-item-note">補足メモ（任意）</label>
                <textarea
                  id="new-item-note"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="group-form-actions">
                <Button type="submit" variant="primary">
                  保存
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setItemFormOpen(false);
                    resetItemForm();
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          )}
          {itemsLoading ? (
            <SkeletonLoader rows={5} height="2rem" />
          ) : items.length === 0 ? (
            <p className="audit-empty">
              {totalItems === 0
                ? 'まだアイテムはありません。'
                : '検索条件・フィルタに一致するアイテムがありません。'}
            </p>
          ) : (
            <>
              <ul className="group-item-list" aria-label="アイテム一覧">
                {items.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      className="group-item-card"
                      onClick={() => loadItemDetail(it.id)}
                    >
                      <div className="group-item-card__row">
                        <span className="group-item-card__title">{it.title}</span>
                        <span className="group-item-card__type">({it.type})</span>
                      </div>
                      {it.subtitle ? (
                        <div className="group-item-card__subtitle">{it.subtitle}</div>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="audit-pagination-wrap">
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
              </div>
            </>
          )}
          {itemLoading && (
            <p className="audit-panel__hint" style={{ marginTop: 'var(--spacing-md)' }}>
              アイテムを読み込み中…
            </p>
          )}
          {selectedItem && (
            <div className="group-item-detail" role="region" aria-label="選択中のアイテム">
              {!editForm && (
                <>
                  <h3>{selectedItem.payload.title}</h3>
                  <p style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                    種別: <code>{selectedItem.payload.type}</code>
                    {selectedItem.payload.detailTemplate &&
                      selectedItem.payload.detailTemplate !== 'generic' && (
                        <>
                          {' '}
                          · テンプレート:{' '}
                          <code>
                            {getTemplateDefinition(
                              selectedItem.payload.detailTemplate as
                                | 'login'
                                | 'credit_card'
                                | 'bank_account'
                            )?.label ?? selectedItem.payload.detailTemplate}
                          </code>
                        </>
                      )}
                  </p>
                  {selectedItem.payload.detailTemplate &&
                    selectedItem.payload.detailTemplate !== 'generic' &&
                    selectedItem.payload.detailFields &&
                    getTemplateDefinition(
                      selectedItem.payload.detailTemplate as 'login' | 'credit_card' | 'bank_account'
                    ) && (
                      <dl className="group-dl">
                        {getTemplateDefinition(
                          selectedItem.payload.detailTemplate as
                            | 'login'
                            | 'credit_card'
                            | 'bank_account'
                        )!.fields.map((f) => {
                          const raw = selectedItem.payload.detailFields?.[f.key] ?? '';
                          return (
                            <div key={f.key} className="group-dl__row">
                              <dt>{f.label}</dt>
                              <dd>
                                {f.input === 'password' ? (
                                  <input type="password" readOnly value={raw} />
                                ) : (
                                  <span style={{ whiteSpace: 'pre-wrap' }}>{raw || '—'}</span>
                                )}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}
                  {(!selectedItem.payload.detailTemplate ||
                    selectedItem.payload.detailTemplate === 'generic' ||
                    !selectedItem.payload.detailFields) && (
                    <p style={{ marginBottom: 'var(--spacing-md)' }}>
                      値:
                      <span className="group-value-readonly">{selectedItem.payload.value}</span>
                    </p>
                  )}
                  {selectedItem.payload.note && (
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: 'var(--spacing-md)' }}>
                      補足: {selectedItem.payload.note}
                    </p>
                  )}
                  <div className="group-form-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditForm(itemPayloadToEditFormState(selectedItem.payload))}
                    >
                      編集
                    </Button>
                  </div>
                </>
              )}
              {editForm && (
                <form onSubmit={submitEditItem} className="group-form-stack">
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>アイテムを編集</h3>
                  <div>
                    <label htmlFor="edit-item-title">タイトル</label>
                    <input
                      id="edit-item-title"
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                      }
                      required
                    />
                  </div>
                  {editForm.mode === 'structured' && (
                    <>
                      <p className="audit-panel__hint">
                        テンプレート:{' '}
                        <strong>
                          {getTemplateDefinition(editForm.detailTemplate)?.label ??
                            editForm.detailTemplate}
                        </strong>
                        （変更不可）
                      </p>
                      {getTemplateDefinition(editForm.detailTemplate)?.fields.map((f) => (
                        <div key={f.key}>
                          <label htmlFor={`edit-item-field-${f.key}`}>{f.label}</label>
                          {f.input === 'textarea' ? (
                            <textarea
                              id={`edit-item-field-${f.key}`}
                              value={editForm.detailFields[f.key] ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev && prev.mode === 'structured'
                                    ? {
                                        ...prev,
                                        detailFields: {
                                          ...prev.detailFields,
                                          [f.key]: e.target.value,
                                        },
                                      }
                                    : prev
                                )
                              }
                              rows={3}
                            />
                          ) : (
                            <input
                              id={`edit-item-field-${f.key}`}
                              type={f.input === 'password' ? 'password' : 'text'}
                              value={editForm.detailFields[f.key] ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev && prev.mode === 'structured'
                                    ? {
                                        ...prev,
                                        detailFields: {
                                          ...prev.detailFields,
                                          [f.key]: e.target.value,
                                        },
                                      }
                                    : prev
                                )
                              }
                              autoComplete="off"
                            />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {editForm.mode === 'generic' && (
                    <>
                      <div>
                        <label htmlFor="edit-item-type">種別</label>
                        <select
                          id="edit-item-type"
                          value={editForm.type}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev && prev.mode === 'generic'
                                ? {
                                    ...prev,
                                    type: e.target.value as ItemType,
                                  }
                                : prev
                            )
                          }
                        >
                          <option value="password">パスワード</option>
                          <option value="note">メモ</option>
                          <option value="key">キー</option>
                          <option value="other">その他</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-item-value">内容</label>
                        <textarea
                          id="edit-item-value"
                          value={editForm.value}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev && prev.mode === 'generic'
                                ? { ...prev, value: e.target.value }
                                : prev
                            )
                          }
                          required
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label htmlFor="edit-item-note">補足メモ（任意）</label>
                    <textarea
                      id="edit-item-note"
                      value={editForm.note}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, note: e.target.value } : prev))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="group-form-actions">
                    <Button type="submit" variant="primary">
                      保存
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditForm(null)}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
