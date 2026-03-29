import type { DetailTemplateId, ItemPayload } from './types';
import { getTemplateDefinition } from './template-definitions';

/** 一覧の補足1行（検索対象にも使う） */
export function getItemListSubtitle(payload: ItemPayload): string {
  if (payload.detailTemplate && payload.detailTemplate !== 'generic' && payload.detailFields) {
    const f = payload.detailFields;
    switch (payload.detailTemplate) {
      case 'login': {
        const parts = [f.website, f.username].filter(Boolean);
        return parts.join(' · ') || '';
      }
      case 'credit_card':
        return f.number ? `···${f.number.slice(-4)}` : f.cardholder || '';
      case 'bank_account':
        return [f.bank_name, f.account_number].filter(Boolean).join(' · ');
      default:
        return '';
    }
  }
  if (payload.type === 'password' && payload.value.trim().startsWith('{')) {
    try {
      const j = JSON.parse(payload.value) as { website?: string; username?: string };
      return [j.website, j.username].filter(Boolean).join(' · ');
    } catch {
      return '';
    }
  }
  const v = payload.value.trim();
  return v.length > 48 ? `${v.slice(0, 48)}…` : v;
}

/** タイトル・本文・テンプレートフィールドを結合した検索用テキスト */
export function getSearchableBlob(payload: ItemPayload): string {
  const parts: string[] = [payload.title, payload.value, payload.note ?? ''];
  if (payload.detailFields) {
    parts.push(...Object.values(payload.detailFields));
  }
  return parts.join('\n').toLowerCase();
}

export function detailTemplateLabel(id: DetailTemplateId | undefined): string {
  if (!id || id === 'generic') return '';
  const d = getTemplateDefinition(id as 'login' | 'credit_card' | 'bank_account');
  return d?.label ?? id;
}
