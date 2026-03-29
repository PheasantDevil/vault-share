/**
 * 1Password CSV形式のエクスポーター
 *
 * アイテムデータを1Password CSV形式に変換します。
 */

import { ItemPayload } from '../items/types';

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

  if (item.detailTemplate === 'login' && item.detailFields) {
    website = item.detailFields.website ?? '';
    username = item.detailFields.username ?? '';
    password = item.detailFields.password ?? '';
  } else if (item.type === 'password') {
    try {
      const passwordData = JSON.parse(item.value) as {
        website?: string;
        username?: string;
        password?: string;
      };
      website = passwordData.website || '';
      username = passwordData.username || '';
      password = passwordData.password || '';
      if (item.note) {
        notes = item.note;
      }
    } catch {
      password = item.value;
    }
  } else {
    notes = item.value || item.note || '';
  }

  let type = 'Secure Note';
  if (item.detailTemplate === 'credit_card') {
    type = 'Credit Card';
    if (item.detailFields && Object.keys(item.detailFields).length > 0) {
      const lines = Object.entries(item.detailFields)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`);
      notes = [notes, ...lines].filter(Boolean).join('\n');
    }
  } else if (item.detailTemplate === 'bank_account') {
    type = 'Bank Account';
    if (item.detailFields && Object.keys(item.detailFields).length > 0) {
      const lines = Object.entries(item.detailFields)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`);
      notes = [notes, ...lines].filter(Boolean).join('\n');
    }
  } else if (item.type === 'password') {
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
    return headers
      .map((header) => escapeCSVValue(csvRow[header as keyof OnePasswordCSVRow] || ''))
      .join(',');
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
