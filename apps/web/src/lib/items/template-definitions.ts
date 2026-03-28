import type { DetailTemplateId, ItemType } from './types';

export type FieldInputKind = 'text' | 'password' | 'textarea';

export interface TemplateFieldDef {
  key: string;
  label: string;
  input: FieldInputKind;
  /** 空なら不可（汎用テンプレート以外で最低限の入力チェックに使用） */
  required?: boolean;
}

export interface TemplateDefinition {
  id: Exclude<DetailTemplateId, 'generic'>;
  label: string;
  itemType: ItemType;
  fields: TemplateFieldDef[];
}

export const STRUCTURED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'login',
    label: 'ログイン',
    itemType: 'password',
    fields: [
      { key: 'username', label: 'ユーザー名', input: 'text' },
      { key: 'password', label: 'パスワード', input: 'password', required: true },
      { key: 'website', label: 'Webサイト', input: 'text' },
    ],
  },
  {
    id: 'credit_card',
    label: 'クレジットカード',
    itemType: 'other',
    fields: [
      { key: 'cardholder', label: 'カード所有者の氏名', input: 'text', required: true },
      { key: 'card_type', label: '種類', input: 'text' },
      { key: 'number', label: '番号', input: 'text', required: true },
      { key: 'verification_code', label: '認証コード', input: 'password' },
      { key: 'expiry', label: '有効期限', input: 'text' },
      { key: 'valid_from', label: '有効開始年', input: 'text' },
    ],
  },
  {
    id: 'bank_account',
    label: '銀行口座',
    itemType: 'other',
    fields: [
      { key: 'bank_name', label: '銀行名', input: 'text', required: true },
      { key: 'account_holder', label: '口座名義', input: 'text' },
      { key: 'account_type', label: '種類', input: 'text' },
      { key: 'branch_code', label: '銀行支店コード', input: 'text' },
      { key: 'account_number', label: '口座番号', input: 'text', required: true },
      { key: 'swift', label: 'SWIFT コード', input: 'text' },
      { key: 'iban', label: 'IBAN 番号', input: 'text' },
      { key: 'pin', label: '暗証番号', input: 'password' },
    ],
  },
];

const TEMPLATE_BY_ID = Object.fromEntries(
  STRUCTURED_TEMPLATES.map((t) => [t.id, t])
) as Record<TemplateDefinition['id'], TemplateDefinition>;

export function getTemplateDefinition(
  id: TemplateDefinition['id']
): TemplateDefinition | undefined {
  return TEMPLATE_BY_ID[id];
}

/** テンプレート切り替え時に空の入力マップを作る */
export function initialEmptyFieldsForTemplate(
  templateId: TemplateDefinition['id']
): Record<string, string> {
  const def = getTemplateDefinition(templateId);
  if (!def) return {};
  const o: Record<string, string> = {};
  for (const f of def.fields) {
    o[f.key] = '';
  }
  return o;
}

/** テンプレート用フィールドを人が読める本文にし、検索・CSV 互換の value に使う */
export function serializeDetailFieldsToValue(
  templateId: TemplateDefinition['id'],
  fields: Record<string, string>
): string {
  const def = getTemplateDefinition(templateId);
  if (!def) return '';
  const lines: string[] = [`[${def.label}]`];
  for (const f of def.fields) {
    const v = (fields[f.key] ?? '').trim();
    if (v) {
      lines.push(`${f.label}: ${v}`);
    }
  }
  return lines.join('\n');
}

/** 必須キーと「いずれか1つは入力」のチェック */
export function validateStructuredFields(
  templateId: TemplateDefinition['id'],
  raw: Record<string, unknown> | undefined
): { ok: true; fields: Record<string, string> } | { ok: false; message: string } {
  const def = getTemplateDefinition(templateId);
  if (!def) {
    return { ok: false, message: '不正なテンプレートです' };
  }
  const fields: Record<string, string> = {};
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined;
  for (const f of def.fields) {
    const cell = r?.[f.key];
    const v = typeof cell === 'string' ? cell.trim() : '';
    fields[f.key] = v;
    if (f.required && !v) {
      return { ok: false, message: `${f.label}は必須です` };
    }
  }
  const hasAny = def.fields.some((f) => (fields[f.key] ?? '').length > 0);
  if (!hasAny) {
    return { ok: false, message: 'いずれかの項目を入力してください' };
  }
  return { ok: true, fields };
}
