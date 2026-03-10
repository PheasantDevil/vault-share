/**
 * Firestore document shapes (plain fields only; item payload is encrypted at app layer).
 */

export interface UserDoc {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  mfaEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDoc {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMemberDoc {
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface InvitationDoc {
  id: string;
  groupId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

/** Stored item: encrypted payload + plain metadata for querying */
export interface ItemDoc {
  id: string;
  groupId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  /** AES-256 encrypted JSON of ItemPayload */
  ciphertext: string;
  /** IV (base64) for decryption */
  iv: string;
  /** Optional: key version for rotation */
  keyVersion?: number;
}

export interface AuditLogDoc {
  id: string;
  groupId: string;
  itemId?: string | null;
  actorUid: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
