import { describe, it, expect } from 'vitest';
import { getSafePostLoginPath } from './safe-post-login-path';

describe('getSafePostLoginPath', () => {
  it('returns dashboard for null or empty', () => {
    expect(getSafePostLoginPath(null)).toBe('/dashboard');
    expect(getSafePostLoginPath('')).toBe('/dashboard');
  });

  it('allows same-origin relative paths', () => {
    expect(getSafePostLoginPath('/dashboard/groups/x')).toBe('/dashboard/groups/x');
    expect(getSafePostLoginPath('/dashboard?foo=1')).toBe('/dashboard?foo=1');
  });

  it('rejects protocol-relative and absolute URLs', () => {
    expect(getSafePostLoginPath('//evil.example/path')).toBe('/dashboard');
    expect(getSafePostLoginPath('https://evil.example/')).toBe('/dashboard');
  });
});
