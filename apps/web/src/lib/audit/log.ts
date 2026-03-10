import { getDb, COLLECTIONS } from '@vault-share/db';
import type { AuditLogDoc } from '@vault-share/db';

type AuditAction =
  | 'group.create'
  | 'group.updateName'
  | 'group.delete'
  | 'member.add'
  | 'member.changeRole'
  | 'member.remove'
  | 'item.create'
  | 'item.update'
  | 'item.delete';

interface AuditLogParams {
  groupId: string;
  actorUid: string;
  action: AuditAction;
  itemId?: string;
  details?: Record<string, unknown>;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  const db = getDb();
  const col = db.collection(COLLECTIONS.auditLogs);
  const docRef = col.doc();
  const now = new Date().toISOString();
  const doc: AuditLogDoc = {
    id: docRef.id,
    groupId: params.groupId,
    itemId: params.itemId ?? null,
    actorUid: params.actorUid,
    action: params.action,
    details: params.details,
    createdAt: now,
  };
  await docRef.set(doc);
}

