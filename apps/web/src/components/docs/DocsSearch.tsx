'use client';

import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './docs.module.css';

type DocItem = { slug: string; title: string; body: string };

function hrefForSlug(slug: string): string {
  return '/docs/' + slug.split('/').map(encodeURIComponent).join('/');
}

export function DocsSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/generated/docs-search.json')
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: DocItem[] }) => {
        if (!cancelled) setItems(Array.isArray(d.docs) ? d.docs : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['title', 'body', 'slug'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items]
  );

  const results = useMemo(() => {
    const t = q.trim();
    if (!t) return [];
    return fuse.search(t, { limit: 12 }).map((r) => r.item);
  }, [fuse, q]);

  const go = useCallback(
    (slug: string) => {
      router.push(hrefForSlug(slug));
      setQ('');
    },
    [router]
  );

  return (
    <div className={styles.search}>
      <label htmlFor="docs-search-input" className="sr-only">
        ドキュメントを検索
      </label>
      <input
        id="docs-search-input"
        type="search"
        className={styles.searchInput}
        placeholder={loading ? '検索を読み込み中…' : '全文検索…'}
        value={q}
        disabled={loading}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {q.trim() !== '' && results.length > 0 ? (
        <ul className={styles.searchResults} aria-label="検索結果">
          {results.map((doc) => (
            <li key={doc.slug}>
              <button type="button" className={styles.searchResultBtn} onClick={() => go(doc.slug)}>
                <div className={styles.searchResultTitle}>{doc.title}</div>
                <div className={styles.searchResultSlug}>{doc.slug}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {q.trim() !== '' && !loading && results.length === 0 ? (
        <ul className={styles.searchResults} role="status">
          <li className={styles.searchResultBtn} style={{ cursor: 'default' }}>
            一致するドキュメントがありません
          </li>
        </ul>
      ) : null}
    </div>
  );
}
