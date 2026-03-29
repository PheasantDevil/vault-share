/**
 * 1Password 1PUX形式のパーサー
 *
 * 1Passwordの1PUXエクスポート形式（JSON）を解析し、アイテムデータに変換します。
 * 1PUX形式: { version: 1, vaults: [{ uuid, name, items: [...] }] }
 */

import type { DetailTemplateId, ItemType } from '../items/types';

export interface OnePuxField {
  id: string;
  label: string;
  value: string;
  type: string;
  purpose?: string;
}

export interface OnePuxSection {
  id: string;
  title?: string;
  fields: OnePuxField[];
}

export interface OnePuxItem {
  uuid: string;
  title: string;
  category: string;
  fields: OnePuxField[];
  sections?: OnePuxSection[];
  notesPlain?: string;
}

export interface OnePuxVault {
  uuid: string;
  name: string;
  items: OnePuxItem[];
}

export interface OnePuxDocument {
  version: number;
  vaults: OnePuxVault[];
}

export interface ParsedItem {
  title: string;
  type: ItemType;
  value: string;
  note?: string;
  detailTemplate?: DetailTemplateId;
  detailFields?: Record<string, string>;
}

/**
 * 1PUX JSON文字列をパースしてOnePuxDocumentに変換
 */
export function parse1Pux(jsonText: string): OnePuxDocument {
  try {
    const data = JSON.parse(jsonText) as OnePuxDocument;
    if (!data.version || !Array.isArray(data.vaults)) {
      throw new Error('無効な1PUX形式です。versionとvaultsが必要です。');
    }
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSONのパースに失敗しました。有効なJSON形式である必要があります。');
    }
    throw error;
  }
}

/**
 * 1PUXアイテムをItemPayloadに変換
 */
export function convert1PuxItemToPayload(item: OnePuxItem): ParsedItem {
  const title = item.title || 'Untitled';

  // categoryに基づいてItemTypeを決定
  let type: ItemType = 'other';
  const category = (item.category || '').toLowerCase();
  if (category === 'login' || category === 'password') {
    type = 'password';
  } else if (category === 'secure note' || category === 'note') {
    type = 'note';
  } else if (category === 'ssh key' || category === 'key') {
    type = 'key';
  }

  const fieldsMap = new Map<string, string>();
  function ingestField(field: OnePuxField) {
    if (!field.value) return;
    const label = field.label.toLowerCase();
    fieldsMap.set(label, field.value);
    const p = (field.purpose || '').toUpperCase();
    if (p === 'USERNAME') fieldsMap.set('username', field.value);
    if (p === 'PASSWORD') fieldsMap.set('password', field.value);
    if (p === 'URL' || p === 'WEBSITE') fieldsMap.set('website', field.value);
  }
  for (const field of item.fields) {
    ingestField(field);
  }
  if (item.sections) {
    for (const section of item.sections) {
      for (const field of section.fields) {
        ingestField(field);
      }
    }
  }

  const notePlain = item.notesPlain || '';

  if (category === 'login' || category === 'password') {
    const website = fieldsMap.get('website') || fieldsMap.get('url') || '';
    const username = fieldsMap.get('username') || fieldsMap.get('email') || '';
    const password = fieldsMap.get('password') || '';
    if (website || username || password) {
      return {
        title,
        type: 'password' as const,
        value: '',
        note: notePlain || undefined,
        detailTemplate: 'login' as const,
        detailFields: {
          website,
          username,
          password,
        },
      };
    }
  }

  if (category.includes('credit')) {
    const detailFields = {
      cardholder:
        fieldsMap.get('cardholder') || fieldsMap.get('name on card') || fieldsMap.get('name') || '',
      card_type: fieldsMap.get('type') || fieldsMap.get('card type') || '',
      number: fieldsMap.get('number') || fieldsMap.get('ccnum') || '',
      verification_code: fieldsMap.get('cvv') || fieldsMap.get('verification code') || '',
      expiry: fieldsMap.get('expiry') || '',
      valid_from: fieldsMap.get('valid from year') || fieldsMap.get('valid from') || '',
    };
    if (Object.values(detailFields).some((v) => v.trim())) {
      return {
        title,
        type: 'other',
        value: '',
        note: notePlain || undefined,
        detailTemplate: 'credit_card' as const,
        detailFields,
      };
    }
  }

  if (category.includes('bank')) {
    const detailFields = {
      bank_name: fieldsMap.get('bank name') || '',
      account_holder: fieldsMap.get('account holder') || fieldsMap.get('owner') || '',
      account_type: fieldsMap.get('type') || fieldsMap.get('account type') || '',
      branch_code: fieldsMap.get('branch code') || fieldsMap.get('routing') || '',
      account_number: fieldsMap.get('account number') || fieldsMap.get('account no') || '',
      swift: fieldsMap.get('swift') || fieldsMap.get('swift code') || '',
      iban: fieldsMap.get('iban') || '',
      pin: fieldsMap.get('pin') || fieldsMap.get('pin code') || '',
    };
    if (Object.values(detailFields).some((v) => v.trim())) {
      return {
        title,
        type: 'other',
        value: '',
        note: notePlain || undefined,
        detailTemplate: 'bank_account' as const,
        detailFields,
      };
    }
  }

  let value = '';
  let note = notePlain;

  if (type === 'password') {
    const passwordData: Record<string, string> = {};
    const website = fieldsMap.get('website') || fieldsMap.get('url') || '';
    const username = fieldsMap.get('username') || fieldsMap.get('email') || '';
    const password = fieldsMap.get('password') || '';

    if (website) passwordData.website = website;
    if (username) passwordData.username = username;
    if (password) passwordData.password = password;

    value = JSON.stringify(passwordData);
  } else {
    value = item.notesPlain || fieldsMap.get('notes') || '';
    note = '';
  }

  return {
    title,
    type,
    value,
    note: note || undefined,
  };
}

/**
 * 1PUX JSON文字列をパースしてParsedItem配列に変換
 */
export function parse1PuxToItems(jsonText: string): ParsedItem[] {
  const document = parse1Pux(jsonText);
  const items: ParsedItem[] = [];

  // すべてのvaultからアイテムを抽出
  for (const vault of document.vaults) {
    if (!Array.isArray(vault.items)) {
      continue;
    }
    for (const item of vault.items) {
      try {
        const parsedItem = convert1PuxItemToPayload(item);
        items.push(parsedItem);
      } catch (error) {
        console.error(`Failed to parse item ${item.uuid}:`, error);
        // パースに失敗したアイテムはスキップ
      }
    }
  }

  return items;
}
