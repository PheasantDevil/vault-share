import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { GroupList } from '@/components/GroupList';
import { PageLayout } from '@/components/ui/PageLayout';

export default function DashboardPage() {
  return (
    <PageLayout title="ダッシュボード" description="参加中のグループ一覧" maxWidth={720}>
      <div className="app-toolbar">
        <Link href="/dashboard/groups/new" className="app-btn app-btn--primary">
          グループを作成
        </Link>
        <Link href="/dashboard/settings" className="app-btn app-btn--secondary">
          設定
        </Link>
        <LogoutButton />
        <div className="app-toolbar__spacer">
          <Link href="/" className="app-btn app-btn--ghost">
            トップへ
          </Link>
        </div>
      </div>
      <GroupList />
    </PageLayout>
  );
}
