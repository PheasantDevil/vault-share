/**
 * Markdown からタイトル・検索用プレーンテキストを抽出
 */
export function extractTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)\s*$/);
    if (m) return m[1].trim();
  }
  return '無題';
}

export function markdownToPlainText(markdown: string): string {
  let t = markdown;
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`[^`]+`/g, ' ');
  t = t.replace(/^#{1,6}\s+/gm, ' ');
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/[*_~>|]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
