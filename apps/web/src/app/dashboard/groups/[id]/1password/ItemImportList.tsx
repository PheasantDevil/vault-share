'use client';

import { useEffect, useRef } from 'react';

export type ItemRow = {
  id: string;
  title: string;
  category: string;
};

type ItemImportListProps = {
  filteredItems: ItemRow[];
  totalCount: number;
  selectedIds: Set<string>;
  onToggle: (itemId: string) => void;
  onToggleAllVisible: () => void;
};

/**
 * フィルタ後のアイテム一覧と、表示行に対する一括選択（ヘッダチェック）
 */
export function ItemImportList({
  filteredItems,
  totalCount,
  selectedIds,
  onToggle,
  onToggleAllVisible,
}: ItemImportListProps) {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const visibleIds = filteredItems.map((i) => i.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) {
      el.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const selectedTotal = selectedIds.size;
  const visibleSelectedCount = visibleIds.filter((id) => selectedIds.has(id)).length;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>インポートするアイテムを選択してください</p>
        <span style={{ fontSize: '0.875rem', color: 'var(--muted, #666)' }}>
          表示 {filteredItems.length} / 全体 {totalCount} 件 · 選択 {selectedTotal} 件
          {visibleIds.length > 0 && (
            <span style={{ marginLeft: '0.25rem' }}>（表示中 {visibleSelectedCount} 件）</span>
          )}
        </span>
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: '0',
          margin: 0,
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      >
        <li
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid #eee',
            background: 'var(--surface-muted, #f9f9f9)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <input
            ref={headerCheckboxRef}
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleAllVisible}
            disabled={visibleIds.length === 0}
            title="表示中の行をすべて選択 / 解除"
            aria-label="表示中の行をすべて選択または解除"
          />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>タイトル</span>
          <span
            style={{
              marginLeft: 'auto',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--muted, #666)',
            }}
          >
            カテゴリ
          </span>
        </li>
        {filteredItems.length === 0 ? (
          <li style={{ padding: '1rem 0.75rem', color: 'var(--muted, #666)' }}>
            条件に一致するアイテムがありません。検索・カテゴリを変えてください。
          </li>
        ) : (
          filteredItems.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  cursor: 'pointer',
                  gap: '0.5rem',
                  minWidth: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.title || '（無題）'}
                </span>
              </label>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: '0.875rem',
                  color: 'var(--muted, #666)',
                  maxWidth: '40%',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.category}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
