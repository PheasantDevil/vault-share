import { describe, it, expect } from 'vitest';
import { getActionCategory, getActionLabel, shortId } from './ui';

describe('audit-logs/ui', () => {
  it('getActionLabel maps known actions', () => {
    expect(getActionLabel('item.create')).toBe('アイテム作成');
    expect(getActionLabel('unknown.action')).toBe('unknown.action');
  });

  it('getActionCategory groups by prefix', () => {
    expect(getActionCategory('group.create')).toBe('group');
    expect(getActionCategory('member.remove')).toBe('member');
    expect(getActionCategory('item.update')).toBe('item');
    expect(getActionCategory('auth.login')).toBe('auth');
    expect(getActionCategory('custom')).toBe('other');
  });

  it('shortId truncates long strings', () => {
    const id = 'a'.repeat(40);
    expect(shortId(id, 8, 4)).toMatch(/aaaaaaa…aaaa/);
  });
});
