import { GroupList } from '@/components/GroupList';
import { PageLayout } from '@/components/ui/PageLayout';

export default function DashboardPage() {
  return (
    <PageLayout title="ダッシュボード" description="参加中のグループ一覧" maxWidth={720}>
      <GroupList />
    </PageLayout>
  );
}
