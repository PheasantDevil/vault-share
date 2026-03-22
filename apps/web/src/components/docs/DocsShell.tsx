'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { DocsNavNode } from '@/lib/docs/nav-tree';
import { DocsSearch } from './DocsSearch';
import { DocsSidebar } from './DocsSidebar';
import styles from './docs.module.css';

type Props = {
  tree: DocsNavNode[];
  children: React.ReactNode;
};

export function DocsShell({ tree, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="サイドバーを開く"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          <Link href="/docs" className={styles.brand}>
            ドキュメント
          </Link>
          <div className={styles.searchWrap}>
            <DocsSearch />
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="ドキュメント一覧">
          <DocsSidebar tree={tree} />
        </aside>

        {drawerOpen ? (
          <div
            className={styles.drawerBackdrop}
            role="presentation"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
        ) : null}

        <aside
          className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
          aria-hidden={!drawerOpen}
        >
          <div className={styles.drawerHeader}>
            <span>目次</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="サイドバーを閉じる"
            >
              ×
            </button>
          </div>
          <div className={styles.navScroll}>
            <DocsSidebar tree={tree} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
