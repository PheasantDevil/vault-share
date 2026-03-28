import type { ItemPayload, ItemType } from './types';
import {
  getTemplateDefinition,
  serializeDetailFieldsToValue,
  validateStructuredFields,
  type TemplateDefinition,
} from './template-definitions';

const ITEM_TYPES: ItemType[] = ['password', 'note', 'key', 'other'];

function isItemType(s: unknown): s is ItemType {
  return typeof s === 'string' && (ITEM_TYPES as string[]).includes(s);
}

const STRUCTURED_IDS: TemplateDefinition['id'][] = ['login', 'credit_card', 'bank_account'];

function isStructuredTemplate(s: unknown): s is TemplateDefinition['id'] {
  return typeof s === 'string' && (STRUCTURED_IDS as string[]).includes(s);
}

/**
 * アイテム作成・更新 API 用にリクエストボディを ItemPayload に正規化する
 */
export function normalizeItemPayloadFromRequest(body: unknown):
  | { ok: true; payload: ItemPayload }
  | {
      ok: false;
      message: string;
      fields?: Record<string, string | undefined>;
    } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'リクエスト本文が不正です' };
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const noteRaw = typeof b.note === 'string' ? b.note.trim() : '';
  const note = noteRaw || undefined;

  if (!title) {
    return {
      ok: false,
      message: 'タイトルは必須です',
      fields: { title: 'タイトルは必須です' },
    };
  }

  if (isStructuredTemplate(b.detailTemplate)) {
    const validated = validateStructuredFields(
      b.detailTemplate,
      b.detailFields as Record<string, unknown>
    );
    if (!validated.ok) {
      return { ok: false, message: validated.message };
    }
    const def = getTemplateDefinition(b.detailTemplate);
    const itemType = def?.itemType ?? 'other';
    const value = serializeDetailFieldsToValue(b.detailTemplate, validated.fields);
    const payload: ItemPayload = {
      title,
      type: itemType,
      value,
      note,
      detailTemplate: b.detailTemplate,
      detailFields: validated.fields,
    };
    return { ok: true, payload };
  }

  const type: ItemType = isItemType(b.type) ? b.type : 'other';
  const value = typeof b.value === 'string' ? b.value : '';

  if (!value.trim()) {
    return {
      ok: false,
      message: '内容は必須です',
      fields: { value: '内容は必須です' },
    };
  }

  const payload: ItemPayload = {
    title,
    type,
    value,
    note,
  };
  return { ok: true, payload };
}
