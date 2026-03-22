/**
 * ビルド／predev 用: 検索インデックス JSON を `public/generated/` に出力
 */
import fs from 'fs/promises';
import path from 'path';
import { extractTitleFromMarkdown, markdownToPlainText } from './markdown';
import { getAllDocSlugs, readMarkdownSource } from './scan';

export async function generateDocsArtifacts(): Promise<void> {
  const outDir = path.join(process.cwd(), 'public', 'generated');
  await fs.mkdir(outDir, { recursive: true });

  const slugs = await getAllDocSlugs();
  const docs: { slug: string; title: string; body: string }[] = [];

  for (const slug of slugs) {
    const src = await readMarkdownSource(slug);
    if (!src) continue;
    docs.push({
      slug,
      title: extractTitleFromMarkdown(src),
      body: markdownToPlainText(src),
    });
  }

  const payload = { docs, generatedAt: new Date().toISOString() };
  await fs.writeFile(path.join(outDir, 'docs-search.json'), JSON.stringify(payload), 'utf8');
}
