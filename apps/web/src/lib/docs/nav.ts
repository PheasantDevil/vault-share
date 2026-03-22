import { cache } from 'react';
import { extractTitleFromMarkdown } from './markdown';
import { buildDocsNavTree, type DocsNavNode } from './nav-tree';
import { getAllDocSlugs, readMarkdownSource } from './scan';

export type { DocsNavNode };

async function loadDocsNavTree(): Promise<DocsNavNode[]> {
  const slugs = await getAllDocSlugs();
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const src = await readMarkdownSource(slug);
      const title = src ? extractTitleFromMarkdown(src) : slug;
      return { slug, title };
    })
  );
  return buildDocsNavTree(items);
}

/** 同一リクエスト内でレイアウト・ページの二重スキャンを避ける */
export const getDocsNavTree = cache(loadDocsNavTree);
