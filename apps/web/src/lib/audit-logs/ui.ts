/**
 * 監査ログ画面用の表示ヘルパー
 */

const ACTION_LABELS: Record<string, string> = {
  'group.create': 'グループ作成',
  'group.updateName': 'グループ名更新',
  'group.delete': 'グループ削除',
  'member.add': 'メンバー追加',
  'member.changeRole': 'メンバー権限変更',
  'member.remove': 'メンバー削除',
  'item.create': 'アイテム作成',
  'item.update': 'アイテム更新',
  'item.delete': 'アイテム削除',
  'auth.login': 'ログイン',
  'auth.loginFailed': 'ログイン失敗',
  'auth.logout': 'ログアウト',
  'auth.unauthorizedAccess': '不正アクセス',
};

export type AuditActionCategory = 'group' | 'member' | 'item' | 'auth' | 'other';

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getActionCategory(action: string): AuditActionCategory {
  if (action.startsWith('group.')) return 'group';
  if (action.startsWith('member.')) return 'member';
  if (action.startsWith('item.')) return 'item';
  if (action.startsWith('auth.')) return 'auth';
  return 'other';
}

export function formatLogDateParts(iso: string): { dateLine: string; timeLine: string } {
  const d = new Date(iso);
  return {
    dateLine: d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }),
    timeLine: d.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export function shortId(id: string, head = 8, tail = 4): string {
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

/** フィルタ用セレクトの選択肢 */
export const AUDIT_ACTION_FILTER_OPTIONS: { value: string; label: string }[] = Object.entries(
  ACTION_LABELS
).map(([value, label]) => ({ value, label }));
