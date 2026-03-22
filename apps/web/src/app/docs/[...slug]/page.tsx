import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsArticle } from '@/components/docs/DocsArticle';
import { extractTitleFromMarkdown } from '@/lib/docs/markdown';
import { getAllDocSlugs, readMarkdownSource } from '@/lib/docs/scan';

type PageProps = {
  params: { slug: string[] };
};

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const slugs = await getAllDocSlugs();
  return slugs.map((s) => ({ slug: s.split('/').filter(Boolean) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug.join('/');
  const md = await readMarkdownSource(slug);
  if (!md) {
    return { title: '見つかりません' };
  }
  const title = extractTitleFromMarkdown(md);
  return {
    title,
    description: `${title} — Vault Share ドキュメント`,
  };
}

export default async function DocsSlugPage({ params }: PageProps) {
  const slug = params.slug.join('/');
  const md = await readMarkdownSource(slug);
  if (!md) {
    notFound();
  }
  return <DocsArticle markdown={md} />;
}
