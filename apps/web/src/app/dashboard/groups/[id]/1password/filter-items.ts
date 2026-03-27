/**
 * 1Password インポート画面のクライアント側フィルタ（タイトル検索・カテゴリ）
 */
export type ImportItemFilterable = {
  title: string;
  category: string;
};

export function filterImportItems<T extends ImportItemFilterable>(
  items: T[],
  searchQuery: string,
  categoryFilter: string
): T[] {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }
    if (!q) {
      return true;
    }
    const title = (item.title || '').toLowerCase();
    return title.includes(q);
  });
}
