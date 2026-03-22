import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';

export default function HomePage() {
  return (
    <PageLayout title="Vault Share" description="機密情報を親しい間柄で安全に共有" maxWidth={720}>
      <nav className="app-inline-nav" aria-label="主要ナビゲーション">
        <Link href="/login" className="app-link">
          ログイン
        </Link>
        <span className="app-link-row__sep" aria-hidden>
          /
        </span>
        <Link href="/signup" className="app-link">
          新規登録
        </Link>
        <span className="app-link-row__sep" aria-hidden>
          /
        </span>
        <Link href="/dashboard" className="app-link">
          ダッシュボード
        </Link>
      </nav>
    </PageLayout>
  );
}
