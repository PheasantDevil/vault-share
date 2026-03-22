import Link from 'next/link';
import type { DocsNavNode } from '@/lib/docs/nav-tree';
import styles from './docs.module.css';

function hrefForSlug(slug: string): string {
  return '/docs/' + slug.split('/').map(encodeURIComponent).join('/');
}

function TocNodes({ nodes }: { nodes: DocsNavNode[] }) {
  return (
    <ul className={styles.tocList}>
      {nodes.map((node) => {
        if (node.type === 'file') {
          return (
            <li key={node.slug}>
              <Link href={hrefForSlug(node.slug)} className={styles.tocLink}>
                {node.title}
              </Link>
            </li>
          );
        }
        return (
          <li key={node.name}>
            <div className={styles.tocDir}>{node.name}</div>
            <div className={styles.tocNested}>
              <TocNodes nodes={node.children} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  tree: DocsNavNode[];
};

/** `/docs` 自動生成目次 */
export function DocsToc({ tree }: Props) {
  return (
    <>
      <h1 className={styles.tocTitle}>ドキュメント一覧</h1>
      <p className={styles.tocIntro}>
        リポジトリ <code>docs/</code> 配下の Markdown
        を公開しています。左のサイドバーまたは下の一覧から開けます。
      </p>
      <TocNodes nodes={tree} />
    </>
  );
}
