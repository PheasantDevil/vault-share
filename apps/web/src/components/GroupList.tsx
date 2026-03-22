'use client';

import Link from 'next/link';
import { useGroups } from '@/lib/swr/hooks';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Alert } from '@/components/ui/Alert';

type Group = { id: string; name: string };

export function GroupList() {
  const { groups, isLoading, isError } = useGroups();

  if (isLoading) {
    return <SkeletonLoader rows={3} height="4rem" />;
  }

  if (isError) {
    return <Alert type="error">グループの読み込みに失敗しました</Alert>;
  }

  if (groups.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        参加中のグループはありません。グループを作成するか、招待リンクで参加してください。
      </p>
    );
  }

  return (
    <ul className="app-list">
      {groups.map((g) => (
        <li key={g.id}>
          <Link href={`/dashboard/groups/${g.id}`} className="app-list__link">
            {g.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
