'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

type Props = {
  userLabel: string;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
};

export function AppHeader({ userLabel, onMenuToggle, menuOpen }: Props) {
  return (
    <header className="app-dashboard-header">
      <div className="app-dashboard-header__left">
        {onMenuToggle ? (
          <button
            type="button"
            className="app-dashboard-header__menu-btn"
            onClick={onMenuToggle}
            aria-expanded={menuOpen}
            aria-controls="app-dashboard-sidebar"
            aria-label={menuOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}
          >
            <span className="app-dashboard-header__menu-icon" aria-hidden="true">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        ) : null}
        <Link href="/" className="app-dashboard-header__brand" title="トップへ">
          <span className="app-dashboard-header__logo" aria-hidden="true">
            VS
          </span>
          <span className="app-dashboard-header__title">Vault Share</span>
        </Link>
      </div>
      <div className="app-dashboard-header__right">
        <span className="app-dashboard-header__user" title={userLabel}>
          {userLabel}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
