import { describe, it, expect, afterEach } from 'vitest';
import { isAdminConfigured, isAdminEmail } from './admin-emails';

describe('admin-emails', () => {
  const orig = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (orig === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = orig;
    }
  });

  it('isAdminConfigured は ADMIN_EMAILS が空なら false', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminConfigured()).toBe(false);
    process.env.ADMIN_EMAILS = '';
    expect(isAdminConfigured()).toBe(false);
    process.env.ADMIN_EMAILS = '  ';
    expect(isAdminConfigured()).toBe(false);
  });

  it('isAdminEmail はリスト照合（大小無視）', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com, other@example.com ';
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail('unknown@example.com')).toBe(false);
    expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true);
    expect(isAdminEmail('other@example.com')).toBe(true);
  });
});
