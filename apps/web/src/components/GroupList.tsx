'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Group = { id: string; name: string };

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/groups')
      .then((res) => {
        if (!res.ok) throw new Error('取得に失敗しました');
        return res.json();
      })
      .then((data) => {
        setGroups(data.groups ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'エラーが発生しました'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p style={{ color: 'var(--error, #c00)' }}>{error}</p>;
  if (groups.length === 0) {
    return (
      <p>参加中のグループはありません。グループを作成するか、招待リンクで参加してください。</p>
    );
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {groups.map((g) => (
        <li key={g.id} style={{ marginBottom: '0.5rem' }}>
          <Link href={`/dashboard/groups/${g.id}`}>{g.name}</Link>
        </li>
      ))}
    </ul>
  );
}
