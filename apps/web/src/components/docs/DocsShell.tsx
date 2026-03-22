'use client';

import { FocusTrap } from 'focus-trap-react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
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

  /** focus-trap-react は初回レンダー時のみ options を参照するため useMemo で固定 */
  const drawerFocusTrapOptions = useMemo(
    () => ({
      escapeDeactivates: true,
      returnFocusOnDeactivate: true,
      /** ref 未確定時は focus-trap のデフォルト（先頭のタブ可能要素）へ */
      initialFocus: () => closeButtonRef.current ?? undefined,
      /** タブ可能要素が無い場合のフォールバック（#docs-drawer は tabIndex={-1}） */
      fallbackFocus: '#docs-drawer',
      onDeactivate: () => {
        setDrawerOpen(false);
      },
    }),
    // focus-trap-react は初回のみ options を読むため依存配列は空（setDrawerOpen は安定）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see focus-trap-react README
    []
  );

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="サイドバーを開く"
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

        <FocusTrap active={drawerOpen} focusTrapOptions={drawerFocusTrapOptions}>
          <aside
            id="docs-drawer"
            tabIndex={-1}
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
        </FocusTrap>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
