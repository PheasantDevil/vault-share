export type ItemType = 'password' | 'note' | 'key' | 'other';

/** 手動登録・1Password 連携を意識したテンプレート種別 */
export type DetailTemplateId = 'login' | 'credit_card' | 'bank_account' | 'generic';

export interface ItemPayload {
  title: string;
  type: ItemType;
  value: string;
  note?: string;
  /** テンプレート入力時のみ。既存データ・CSV インポートのみは未設定のことがある */
  detailTemplate?: DetailTemplateId;
  /** テンプレートごとのフィールド（キーは英字スネーク） */
  detailFields?: Record<string, string>;
}
