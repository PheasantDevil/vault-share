'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement;
    const id = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(id);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
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
          <div className={styles.headerBrand}>
            <Link href="/" className={styles.homeLink}>
              Vault Share
            </Link>
            <span className={styles.headerSep} aria-hidden>
              /
            </span>
            <Link href="/docs" className={styles.brand}>
              ドキュメント
            </Link>
          </div>
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="docs-drawer-title"
          aria-hidden={!drawerOpen}
        >
          <div className={styles.drawerHeader}>
            <span id="docs-drawer-title">目次</span>
            <button
              ref={closeButtonRef}
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
