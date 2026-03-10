'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [itemFilter, setItemFilter] = useState<'all' | 'password' | 'note' | 'key' | 'other'>('all');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/groups/${id}/members`).then((r) => r.json()),
      fetch(`/api/groups/${id}/items`).then((r) => r.json()),
    ])
      .then(([gRes, mRes, iRes]) => {
        if (gRes.error) throw new Error(gRes.error);
        setGroup(gRes);
        setEditName(gRes.name);
        setMembers(mRes.members ?? []);
        setItems(iRes.items ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'エラー'))
      .finally(() => setLoading(false));
  }, [id]);

  async function reloadItems() {
    try {
      const res = await fetch(`/api/groups/${id}/items`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'アイテムの取得に失敗しました');
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
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
      if (!res.ok) throw new Error(data.error ?? 'アイテムの作成に失敗しました');
      setItemTitle('');
      setItemType('password');
      setItemValue('');
      setItemNote('');
      setItemFormOpen(false);
      await reloadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
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

  if (loading) return <p>読み込み中...</p>;
  if (error || !group) {
    return (
      <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: 'var(--error, #c00)' }}>{error ?? 'グループが見つかりません'}</p>
        <Link href="/dashboard">ダッシュボードへ</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <p style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard">← ダッシュボード</Link>
      </p>
      <h1 style={{ marginBottom: '1rem' }}>{group.name}</h1>
      {editing ? (
        <form onSubmit={updateGroup} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            style={{ padding: 0.5, marginRight: 0.5 }}
          />
          <button type="submit" style={{ marginRight: 0.5 }}>
            保存
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            キャンセル
          </button>
        </form>
      ) : (
        <p style={{ marginBottom: '1rem' }}>
          <button type="button" onClick={() => setEditing(true)}>
            編集
          </button>
          <button type="button" onClick={deleteGroup} style={{ marginLeft: 0.5 }}>
            削除
          </button>
        </p>
      )}
      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>メンバー</h2>
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
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
      {(() => {
        const filteredItems =
          itemFilter === 'all' ? items : items.filter((it) => it.type === itemFilter);
        if (filteredItems.length === 0) {
          return <p>{items.length === 0 ? 'まだアイテムはありません。' : 'フィルタに一致するアイテムがありません。'}</p>;
        }
        return (
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
            {filteredItems.map((it) => (
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
        );
      })()}
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
    </main>
  );
}
