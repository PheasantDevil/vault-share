import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { GroupList } from '@/components/GroupList';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  return (
    <PageLayout title="ダッシュボード" description="参加中のグループ一覧" maxWidth={720}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Link
          href="/dashboard/groups/new"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          グループを作成
        </Link>
        <Link
          href="/dashboard/settings"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#f5f5f5',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          設定
        </Link>
        <LogoutButton />
        <Link
          href="/"
          style={{
            color: 'var(--link, #0070f3)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginLeft: 'auto',
          }}
        >
          トップへ
        </Link>
      </div>
      <GroupList />
    </PageLayout>
  );
}
