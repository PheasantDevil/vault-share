'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Group = { id: string; name: string };
type Member = { userId: string; role: string; displayName?: string; email?: string };

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/groups/${id}/members`).then((r) => r.json()),
    ])
      .then(([gRes, mRes]) => {
        if (gRes.error) throw new Error(gRes.error);
        setGroup(gRes);
        setEditName(gRes.name);
        setMembers(mRes.members ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'エラー'))
      .finally(() => setLoading(false));
  }, [id]);

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
          <button type="submit" style={{ marginRight: 0.5 }}>保存</button>
          <button type="button" onClick={() => setEditing(false)}>キャンセル</button>
        </form>
      ) : (
        <p style={{ marginBottom: '1rem' }}>
          <button type="button" onClick={() => setEditing(true)}>編集</button>
          <button type="button" onClick={deleteGroup} style={{ marginLeft: 0.5 }}>削除</button>
        </p>
      )}
      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>メンバー</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {members.map((m) => (
          <li key={m.userId}>
            {m.displayName || m.email || m.userId} {m.role === 'owner' ? '(オーナー)' : ''}
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>招待</h2>
      {inviteLink ? (
        <p>
          招待リンク: <a href={inviteLink}>{inviteLink}</a>
          <button type="button" onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ marginLeft: 0.5 }}>
            コピー
          </button>
        </p>
      ) : (
        <button type="button" onClick={createInvite}>招待リンクを発行</button>
      )}
    </main>
  );
}
