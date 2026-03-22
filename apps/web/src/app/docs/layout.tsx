import type { Metadata } from 'next';
import { DocsShell } from '@/components/docs/DocsShell';
import { getDocsNavTree } from '@/lib/docs/nav';

export const metadata: Metadata = {
  title: 'ドキュメント',
  description: 'Vault Share プロジェクトのドキュメント（docs/）',
};

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const tree = await getDocsNavTree();
  return <DocsShell tree={tree}>{children}</DocsShell>;
}
