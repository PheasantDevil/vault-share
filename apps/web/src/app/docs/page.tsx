import { DocsToc } from '@/components/docs/DocsToc';
import { getDocsNavTree } from '@/lib/docs/nav';

export default async function DocsIndexPage() {
  const tree = await getDocsNavTree();
  return <DocsToc tree={tree} />;
}
