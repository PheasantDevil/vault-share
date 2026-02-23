/**
 * Shared API types and DTOs for vault-share.
 * Used by web app and future Chrome extension.
 */

export type ItemCategory = 'login' | 'bank' | 'api_key' | 'note' | 'other';

export interface ItemPayload {
  title: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  category?: ItemCategory;
}

export interface ItemRecord extends ItemPayload {
  id: string;
  groupId: string;
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string;
  deletedAt?: string | null; // logical delete
}

export interface GroupRecord {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type GroupMemberRole = 'owner' | 'member';

export interface GroupMemberRecord {
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
}

export interface InvitationRecord {
  id: string;
  groupId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  usedAt?: string | null;
}
