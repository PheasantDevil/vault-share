'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocsNavNode } from '@/lib/docs/nav-tree';
import styles from './docs.module.css';

function hrefForSlug(slug: string): string {
  return '/docs/' + slug.split('/').map(encodeURIComponent).join('/');
}

function normalizePathname(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

type NavListProps = {
  nodes: DocsNavNode[];
  pathname: string;
  onNavigate?: () => void;
  depth?: number;
};

function NavList({ nodes, pathname, onNavigate, depth = 0 }: NavListProps) {
  return (
    <ul className={styles.navList} data-depth={depth}>
      {nodes.map((node) => {
        if (node.type === 'file') {
          const href = hrefForSlug(node.slug);
          const active = pathname === href;
          return (
            <li key={node.slug}>
              <Link
                href={href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                onClick={onNavigate}
              >
                {node.title}
              </Link>
            </li>
          );
        }
        return (
          <li key={node.name}>
            <span className={styles.navDirLabel}>{node.name}</span>
            <div className={styles.navNested}>
              <NavList
                nodes={node.children}
                pathname={pathname}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  tree: DocsNavNode[];
  onNavigate?: () => void;
  className?: string;
};

export function DocsSidebar({ tree, onNavigate, className }: Props) {
  const pathname = normalizePathname(usePathname());
  const inner = <NavList nodes={tree} pathname={pathname} onNavigate={onNavigate} />;
  if (className) {
    return <div className={className}>{inner}</div>;
  }
  return inner;
}
