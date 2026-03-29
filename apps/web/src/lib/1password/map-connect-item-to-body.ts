/**
 * Connect API の item オブジェクトをアイテム作成 API の JSON ボディに変換する
 */
type ConnectField = { label?: string; value?: string; purpose?: string };
type ConnectItem = {
  title?: string;
  category?: string;
  fields?: ConnectField[];
  sections?: { fields?: ConnectField[] }[];
  notesPlain?: string;
};

function collectFields(item: ConnectItem): Map<string, string> {
  const m = new Map<string, string>();
  const add = (f: ConnectField) => {
    if (!f?.value) return;
    if (f.label) m.set(f.label.toLowerCase(), f.value);
    const p = (f.purpose || '').toUpperCase();
    if (p === 'USERNAME') m.set('username', f.value);
    if (p === 'PASSWORD') m.set('password', f.value);
    if (p === 'URL' || p === 'WEBSITE') m.set('website', f.value);
  };
  for (const f of item.fields ?? []) add(f);
  for (const s of item.sections ?? []) {
    for (const f of s.fields ?? []) add(f);
  }
  return m;
}

export function mapConnectItemToCreateBody(item: ConnectItem): Record<string, unknown> {
  const title = (item.title || 'Untitled').trim();
  const note = (item.notesPlain || '').trim() || undefined;
  const category = (item.category || '').toLowerCase();
  const fm = collectFields(item);

  if (category === 'login' || category === 'password') {
    const website = fm.get('website') || fm.get('url') || '';
    const username = fm.get('username') || fm.get('email') || '';
    const password = fm.get('password') || '';
    if (website || username || password) {
      return {
        title,
        note,
        detailTemplate: 'login',
        detailFields: { website, username, password },
      };
    }
  }

  if (category.includes('credit')) {
    const detailFields = {
      cardholder: fm.get('cardholder') || fm.get('name on card') || fm.get('name') || '',
      card_type: fm.get('type') || fm.get('card type') || '',
      number: fm.get('number') || fm.get('ccnum') || '',
      verification_code: fm.get('cvv') || fm.get('verification code') || '',
      expiry: fm.get('expiry') || '',
      valid_from: fm.get('valid from year') || fm.get('valid from') || '',
    };
    if (Object.values(detailFields).some((v) => v.trim())) {
      return { title, note, detailTemplate: 'credit_card', detailFields };
    }
  }

  if (category.includes('bank')) {
    const detailFields = {
      bank_name: fm.get('bank name') || '',
      account_holder: fm.get('account holder') || fm.get('owner') || '',
      account_type: fm.get('type') || fm.get('account type') || '',
      branch_code: fm.get('branch code') || fm.get('routing') || '',
      account_number: fm.get('account number') || fm.get('account no') || '',
      swift: fm.get('swift') || fm.get('swift code') || '',
      iban: fm.get('iban') || '',
      pin: fm.get('pin') || fm.get('pin code') || '',
    };
    if (Object.values(detailFields).some((v) => v.trim())) {
      return { title, note, detailTemplate: 'bank_account', detailFields };
    }
  }

  const type = mapCategoryToItemType(item.category);
  const value = extractPrimaryValue(item);
  return { title, type, value, note };
}

function mapCategoryToItemType(
  category: string | undefined
): 'password' | 'note' | 'key' | 'other' {
  const c = (category || '').toLowerCase();
  if (c === 'login' || c === 'password') return 'password';
  if (c === 'secure note' || c === 'note') return 'note';
  if (c === 'api credential' || c === 'api key') return 'key';
  return 'other';
}

function extractPrimaryValue(item: ConnectItem): string {
  const fm = collectFields(item);
  const password = fm.get('password');
  if (password) return password;
  const username = fm.get('username');
  if (username) return username;
  const first = item.fields?.find((f) => f.value)?.value;
  return first || '';
}
