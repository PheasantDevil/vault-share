import { describe, it, expect } from 'vitest';
import { filterImportItems } from './filter-items';

describe('filterImportItems', () => {
  const items = [
    { id: '1', title: 'Alpha Login', category: 'LOGIN' },
    { id: '2', title: 'Beta Note', category: 'SECURE_NOTE' },
    { id: '3', title: 'alpha duplicate', category: 'LOGIN' },
  ];

  it('空クエリ・カテゴリなしは全件', () => {
    expect(filterImportItems(items, '', '')).toEqual(items);
  });

  it('タイトルを大文字小文字無視で部分一致', () => {
    const r = filterImportItems(items, 'alpha', '');
    expect(r.map((x) => x.id).sort()).toEqual(['1', '3']);
  });

  it('カテゴリで完全一致', () => {
    const r = filterImportItems(items, '', 'LOGIN');
    expect(r).toHaveLength(2);
  });

  it('検索とカテゴリを併用', () => {
    const r = filterImportItems(items, 'Beta', 'SECURE_NOTE');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('2');
  });
});
