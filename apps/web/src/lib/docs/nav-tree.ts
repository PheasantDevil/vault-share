export type DocsNavFile = {
  type: 'file';
  slug: string;
  title: string;
};

export type DocsNavDir = {
  type: 'dir';
  name: string;
  children: DocsNavNode[];
};

export type DocsNavNode = DocsNavFile | DocsNavDir;

/**
 * フラットな { slug, title } からサイドバー用ツリーを構築
 */
export function buildDocsNavTree(items: { slug: string; title: string }[]): DocsNavNode[] {
  const root: DocsNavNode[] = [];

  for (const item of items) {
    const parts = item.slug.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let level = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      let dir = level.find((n): n is DocsNavDir => n.type === 'dir' && n.name === dirName);
      if (!dir) {
        dir = { type: 'dir', name: dirName, children: [] };
        level.push(dir);
      }
      level = dir.children;
    }

    level.push({
      type: 'file',
      slug: item.slug,
      title: item.title,
    });
  }

  sortTree(root);
  return root;
}

/** ファイルはフル slug ではなく最終セグメントで並べる（同一ディレクトリ内の見た目順） */
function fileSortKey(node: DocsNavFile): string {
  const i = node.slug.lastIndexOf('/');
  return i === -1 ? node.slug : node.slug.slice(i + 1);
}

function compareNodes(a: DocsNavNode, b: DocsNavNode): number {
  if (a.type === 'dir' && b.type === 'file') return -1;
  if (a.type === 'file' && b.type === 'dir') return 1;
  const na = a.type === 'dir' ? a.name : fileSortKey(a);
  const nb = b.type === 'dir' ? b.name : fileSortKey(b);
  return na.localeCompare(nb, 'ja');
}

function sortTree(nodes: DocsNavNode[]): void {
  nodes.sort(compareNodes);
  for (const n of nodes) {
    if (n.type === 'dir') sortTree(n.children);
  }
}
