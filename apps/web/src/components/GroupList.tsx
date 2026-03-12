'use client';

import Link from 'next/link';
import { useGroups } from '@/lib/swr/hooks';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Alert } from '@/components/ui/Alert';

type Group = { id: string; name: string };

export function GroupList() {
  const { groups, isLoading, isError } = useGroups();

  if (isLoading) {
    return <SkeletonLoader count={3} height="4rem" />;
  }

  if (isError) {
    return <Alert type="error">グループの読み込みに失敗しました</Alert>;
  }

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
