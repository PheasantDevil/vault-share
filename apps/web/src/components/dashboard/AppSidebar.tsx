'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SidebarNavItem = {
  href: string;
  label: string;
};

type Props = {
  items: SidebarNavItem[];
  id?: string;
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({ items, id, className, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav
      id={id}
      className={className ?? 'app-dashboard-sidebar'}
      aria-label="ダッシュボード内ナビゲーション"
    >
      <ul className="app-dashboard-sidebar__list">
        {items.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  active
                    ? 'app-dashboard-sidebar__link app-dashboard-sidebar__link--active'
                    : 'app-dashboard-sidebar__link'
                }
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate?.()}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
