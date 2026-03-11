/**
 * 1Password 1PUX形式のパーサー
 *
 * 1Passwordの1PUXエクスポート形式（JSON）を解析し、アイテムデータに変換します。
 * 1PUX形式: { version: 1, vaults: [{ uuid, name, items: [...] }] }
 */

import { ItemPayload, ItemType } from '../items/types';

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

  // fieldsから値を抽出
  const fieldsMap = new Map<string, string>();
  for (const field of item.fields) {
    if (field.value) {
      fieldsMap.set(field.label.toLowerCase(), field.value);
    }
  }

  // sectionsからも値を抽出
  if (item.sections) {
    for (const section of item.sections) {
      for (const field of section.fields) {
        if (field.value) {
          fieldsMap.set(field.label.toLowerCase(), field.value);
        }
      }
    }
  }

  // valueを構築
  let value = '';
  let note = item.notesPlain || '';

  if (type === 'password') {
    // passwordタイプの場合はJSON形式で保存
    const passwordData: Record<string, string> = {};
    const website = fieldsMap.get('website') || fieldsMap.get('url') || '';
    const username = fieldsMap.get('username') || fieldsMap.get('email') || '';
    const password = fieldsMap.get('password') || '';

    if (website) passwordData.website = website;
    if (username) passwordData.username = username;
    if (password) passwordData.password = password;

    value = JSON.stringify(passwordData);
    // noteにはnotesPlainとその他のフィールドを追加
    if (note) {
      note = note;
    }
  } else {
    // password以外のタイプはvalueにnotesPlainまたは最初のフィールドの値を設定
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
