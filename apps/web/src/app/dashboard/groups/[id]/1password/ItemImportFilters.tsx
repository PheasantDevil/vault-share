'use client';

type ItemImportFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  disabled?: boolean;
};

/**
 * 1Password インポート一覧の検索・カテゴリ絞り込み
 */
export function ItemImportFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  disabled = false,
}: ItemImportFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <div>
        <label
          htmlFor="op-import-search"
          style={{
            display: 'block',
            marginBottom: '0.25rem',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          検索（タイトル）
        </label>
        <input
          id="op-import-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          placeholder="タイトルに含まれる文字で絞り込み"
          autoComplete="off"
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label
          htmlFor="op-import-category"
          style={{
            display: 'block',
            marginBottom: '0.25rem',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          カテゴリ
        </label>
        <select
          id="op-import-category"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
          }}
        >
          <option value="">すべて</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
