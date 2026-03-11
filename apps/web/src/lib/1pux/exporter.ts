/**
 * 1Password 1PUX形式のエクスポーター
 *
 * アイテムデータを1Password 1PUX形式（JSON）に変換します。
 */

import { ItemPayload, ItemType } from '../items/types';
import type {
  OnePuxDocument,
  OnePuxVault,
  OnePuxItem,
  OnePuxField,
} from './parser';

/**
 * ItemPayloadを1PUXアイテムに変換
 */
function convertPayloadTo1PuxItem(item: ItemPayload, index: number): OnePuxItem {
  const uuid = generateUuid();
  const fields: OnePuxField[] = [];
  let category = 'Secure Note';
  let notesPlain = '';

  if (item.type === 'password') {
    category = 'Login';
    // passwordタイプの場合はvalueをJSONとしてパース
    try {
      const passwordData = JSON.parse(item.value);
      if (passwordData.website) {
        fields.push({
          id: generateFieldId('website'),
          label: 'website',
          value: passwordData.website,
          type: 'URL',
        });
      }
      if (passwordData.username) {
        fields.push({
          id: generateFieldId('username'),
          label: 'username',
          value: passwordData.username,
          type: 'string',
        });
      }
      if (passwordData.password) {
        fields.push({
          id: generateFieldId('password'),
          label: 'password',
          value: passwordData.password,
          type: 'concealed',
        });
      }
    } catch {
      // JSONパースに失敗した場合はvalueをそのまま使用
      fields.push({
        id: generateFieldId('password'),
        label: 'password',
        value: item.value,
        type: 'concealed',
      });
    }
    // noteがあればnotesPlainに設定
    if (item.note) {
      notesPlain = item.note;
    }
  } else if (item.type === 'key') {
    category = 'SSH Key';
    fields.push({
      id: generateFieldId('notes'),
      label: 'notes',
      value: item.value,
      type: 'string',
    });
    if (item.note) {
      notesPlain = item.note;
    }
  } else {
    // noteタイプまたはotherタイプ
    category = 'Secure Note';
    fields.push({
      id: generateFieldId('notes'),
      label: 'notes',
      value: item.value,
      type: 'string',
    });
    if (item.note) {
      notesPlain = item.note;
    }
  }

  return {
    uuid,
    title: item.title,
    category,
    fields,
    notesPlain: notesPlain || undefined,
  };
}

/**
 * ItemPayload配列を1PUX JSON文字列に変換
 */
export function exportItemsTo1Pux(items: ItemPayload[]): string {
  const vaultUuid = generateUuid();
  const vaultName = 'Vault Share Export';

  const onePuxItems: OnePuxItem[] = items.map((item, index) =>
    convertPayloadTo1PuxItem(item, index)
  );

  const vault: OnePuxVault = {
    uuid: vaultUuid,
    name: vaultName,
    items: onePuxItems,
  };

  const document: OnePuxDocument = {
    version: 1,
    vaults: [vault],
  };

  return JSON.stringify(document, null, 2);
}

/**
 * UUIDを生成（簡易版、実際のUUID v4形式ではないが1PUX形式では問題ない）
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * フィールドIDを生成
 */
function generateFieldId(label: string): string {
  return `field-${label}-${Math.random().toString(36).substring(2, 9)}`;
}
