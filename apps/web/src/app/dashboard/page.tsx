import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { GroupList } from '@/components/GroupList';

export default function DashboardPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>ダッシュボード</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>参加中のグループ一覧</p>
      <p style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard/groups/new" style={{ marginRight: '1rem' }}>
          グループを作成
        </Link>
        <Link href="/dashboard/settings" style={{ marginRight: '1rem' }}>
          設定
        </Link>
        <LogoutButton />
        <Link href="/" style={{ marginLeft: '1rem' }}>
          トップへ
        </Link>
      </p>
      <GroupList />
    </main>
  );
}
