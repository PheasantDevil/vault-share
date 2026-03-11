/**
 * 1Password CSV形式のエクスポーター
 * 
 * アイテムデータを1Password CSV形式に変換します。
 */

import { ItemPayload, ItemType } from '../items/types';

export interface OnePasswordCSVRow {
  Title: string;
  Website: string;
  Username: string;
  Password: string;
  Notes: string;
  Type: string;
}

/**
 * ItemPayloadを1Password CSV行に変換
 */
export function convertToCSVRow(item: ItemPayload): OnePasswordCSVRow {
  let website = '';
  let username = '';
  let password = '';
  let notes = item.note || '';

  // passwordタイプの場合はvalueをJSONとしてパース
  if (item.type === 'password') {
    try {
      const passwordData = JSON.parse(item.value);
      website = passwordData.website || '';
      username = passwordData.username || '';
      password = passwordData.password || '';
      // Notesにはnoteフィールドの内容を追加
      if (item.note) {
        notes = item.note;
      }
    } catch {
      // JSONパースに失敗した場合はvalueをそのまま使用
      password = item.value;
    }
  } else {
    // password以外のタイプはvalueをNotesに
    notes = item.value || item.note || '';
  }

  // Typeを1Password形式に変換
  let type = 'Secure Note';
  if (item.type === 'password') {
    type = 'Login';
  } else if (item.type === 'key') {
    type = 'SSH Key';
  } else if (item.type === 'note') {
    type = 'Secure Note';
  }

  return {
    Title: item.title,
    Website: website,
    Username: username,
    Password: password,
    Notes: notes,
    Type: type,
  };
}

/**
 * ItemPayload配列をCSV文字列に変換
 */
export function exportItemsToCSV(items: ItemPayload[]): string {
  if (items.length === 0) {
    return '';
  }

  // ヘッダー行
  const headers = ['Title', 'Website', 'Username', 'Password', 'Notes', 'Type'];
  const headerRow = headers.map(escapeCSVValue).join(',');

  // データ行
  const rows = items.map((item) => {
    const csvRow = convertToCSVRow(item);
    return headers.map((header) => escapeCSVValue(csvRow[header as keyof OnePasswordCSVRow] || '')).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * CSV値のエスケープ（ダブルクォート、カンマ、改行に対応）
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // ダブルクォートをエスケープ
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}
