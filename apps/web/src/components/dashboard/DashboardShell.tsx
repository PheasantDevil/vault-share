'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AppHeader } from './AppHeader';
import { AppSidebar, type SidebarNavItem } from './AppSidebar';

type MeResponse = {
  user: { uid: string; email: string | null; displayName: string | null };
  isOwnerOfAnyGroup: boolean;
};

async function fetcher(url: string): Promise<MeResponse> {
  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error('Unauthorized') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    throw new Error('Failed to load profile');
  }
  return res.json();
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const { data, error, isLoading } = useSWR<MeResponse>('/api/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  useEffect(() => {
    const err = error as Error & { status?: number };
    if (err?.status !== 401) return;
    const from =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : '/dashboard';
    router.replace(`/login?from=${encodeURIComponent(from)}`);
  }, [error, router]);

  const navItems = useMemo((): SidebarNavItem[] => {
    const isOwner = Boolean(data?.isOwnerOfAnyGroup);
    /** オーナー判定前は誤タップ防止のためオーナー専用項目を無効表示 */
    const ownerOnlyDisabled = isLoading || !isOwner;
    return [
      { href: '/dashboard', label: 'ダッシュボード' },
      {
        href: '/dashboard/groups/new',
        label: 'グループを作成',
        disabled: ownerOnlyDisabled,
      },
      { href: '/dashboard/settings', label: 'アカウント設定' },
      {
        href: '/dashboard/audit-logs',
        label: '監査ログ',
        disabled: ownerOnlyDisabled,
      },
    ];
  }, [data?.isOwnerOfAnyGroup, isLoading]);

  const userLabel =
    data?.user.displayName?.trim() ||
    data?.user.email?.trim() ||
    (isLoading ? '読み込み中…' : 'ユーザー');

  return (
    <div className="app-dashboard-shell">
      <AppHeader
        userLabel={userLabel}
        onMenuToggle={() => setNavOpen((o) => !o)}
        menuOpen={navOpen}
      />
      <div className="app-dashboard-shell__body">
        {navOpen ? (
          <button
            type="button"
            className="app-dashboard-shell__backdrop"
            aria-label="ナビゲーションを閉じる"
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <AppSidebar
          id="app-dashboard-sidebar"
          items={navItems}
          onNavigate={() => setNavOpen(false)}
          className={
            navOpen ? 'app-dashboard-sidebar app-dashboard-sidebar--open' : 'app-dashboard-sidebar'
          }
        />
        <div className="app-dashboard-shell__main">{children}</div>
      </div>
    </div>
  );
}
