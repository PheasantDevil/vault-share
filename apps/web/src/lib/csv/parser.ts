/**
 * 1Password CSV形式のパーサー
 *
 * 1PasswordのCSVエクスポート形式を解析し、アイテムデータに変換します。
 * 標準的な列: Title, Website, Username, Password, Notes, Type 等
 */

import type { DetailTemplateId, ItemType } from '../items/types';

export interface OnePasswordCSVRow {
  Title: string;
  Website?: string;
  Username?: string;
  Password?: string;
  Notes?: string;
  Type?: string;
  [key: string]: string | undefined;
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
 * CSV文字列をパースして1Password形式の行データに変換
 */
export function parseCSV(csvText: string): OnePasswordCSVRow[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error('CSVファイルが空です');
  }

  // ヘッダー行を取得
  const headers = parseCSVLine(lines[0]);
  if (!headers.includes('Title')) {
    throw new Error(
      'CSVファイルにTitle列が見つかりません。1Passwordの標準形式である必要があります。'
    );
  }

  // データ行をパース
  const rows: OnePasswordCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: OnePasswordCSVRow = {} as OnePasswordCSVRow;

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Titleが空の行はスキップ
    if (row.Title && row.Title.trim()) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * CSV行をパース（カンマ区切り、ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // カンマで区切る
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // 最後の値を追加
  values.push(current.trim());

  return values;
}

/**
 * 1Password CSV行をItemPayloadに変換
 */
export function convertToItemPayload(row: OnePasswordCSVRow): ParsedItem {
  const title = row.Title || 'Untitled';

  const rowType = (row.Type || '').toLowerCase();
  const hasLoginColumns = Boolean(row.Website || row.Username || row.Password);
  const looksLikeLogin =
    rowType.includes('login') ||
    rowType.includes('password') ||
    (hasLoginColumns && !rowType.includes('credit') && !rowType.includes('card'));

  // Login 行はテンプレートで保存（1Password 連携しやすい）
  if (looksLikeLogin && hasLoginColumns) {
    const note = (row.Notes || '').trim() || undefined;
    return {
      title,
      type: 'password',
      value: '',
      note,
      detailTemplate: 'login',
      detailFields: {
        website: (row.Website || '').trim(),
        username: (row.Username || '').trim(),
        password: (row.Password || '').trim(),
      },
    };
  }

  let type: ItemType = 'other';
  if (rowType.includes('password') || rowType.includes('login')) {
    type = 'password';
  } else if (rowType.includes('note') || rowType.includes('secure note')) {
    type = 'note';
  } else if (rowType.includes('key') || rowType.includes('ssh')) {
    type = 'key';
  } else if (row.Website || row.Username || row.Password) {
    type = 'password';
  }

  let value = '';
  if (type === 'password') {
    const passwordData: Record<string, string> = {};
    if (row.Website) passwordData.website = row.Website;
    if (row.Username) passwordData.username = row.Username;
    if (row.Password) passwordData.password = row.Password;
    value = JSON.stringify(passwordData);
  } else {
    value = row.Notes || '';
  }

  const note = type === 'password' ? row.Notes || '' : '';

  return {
    title,
    type,
    value,
    note: note || undefined,
  };
}

/**
 * CSV文字列をパースしてParsedItem配列に変換
 */
export function parseCSVToItems(csvText: string): ParsedItem[] {
  const rows = parseCSV(csvText);
  return rows.map(convertToItemPayload);
}
