export type ItemType = 'password' | 'note' | 'key' | 'other';

export interface ItemPayload {
  title: string;
  type: ItemType;
  value: string;
  note?: string;
}
