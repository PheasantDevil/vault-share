import { describe, it, expect } from 'vitest';
import { normalizeItemPayloadFromRequest } from './normalize-item-payload';

describe('normalizeItemPayloadFromRequest', () => {
  it('accepts legacy generic body', () => {
    const r = normalizeItemPayloadFromRequest({
      title: 'T',
      type: 'note',
      value: 'body',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.title).toBe('T');
      expect(r.payload.type).toBe('note');
      expect(r.payload.value).toBe('body');
      expect(r.payload.detailTemplate).toBeUndefined();
    }
  });

  it('rejects generic without value', () => {
    const r = normalizeItemPayloadFromRequest({
      title: 'T',
      type: 'password',
      value: '   ',
    });
    expect(r.ok).toBe(false);
  });

  it('accepts login template with fields', () => {
    const r = normalizeItemPayloadFromRequest({
      title: 'My Login',
      detailTemplate: 'login',
      detailFields: {
        username: 'u',
        password: 'p',
        website: '',
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.type).toBe('password');
      expect(r.payload.detailTemplate).toBe('login');
      expect(r.payload.value).toContain('ユーザー名: u');
      expect(r.payload.value).toContain('パスワード: p');
    }
  });

  it('rejects structured template with all empty fields', () => {
    const r = normalizeItemPayloadFromRequest({
      title: 'X',
      detailTemplate: 'login',
      detailFields: {
        username: '',
        password: '',
        website: '',
      },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects credit_card missing required field', () => {
    const r = normalizeItemPayloadFromRequest({
      title: 'Card',
      detailTemplate: 'credit_card',
      detailFields: {
        cardholder: '',
        number: '4111',
      },
    });
    expect(r.ok).toBe(false);
  });
});
