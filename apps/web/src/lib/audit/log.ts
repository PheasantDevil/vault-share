import { getDb } from '@vault-share/db';
import type { AuditLogDoc } from '@vault-share/db';
import type { NextRequest } from 'next/server';
import { getIpAddress, getUserAgent } from './request-info';

export type AuditAction =
  | 'group.create'
  | 'group.updateName'
  | 'group.delete'
  | 'member.add'
  | 'member.changeRole'
  | 'member.remove'
  | 'item.create'
  | 'item.update'
  | 'item.delete'
  | 'auth.login'
  | 'auth.loginFailed'
  | 'auth.logout'
  | 'auth.unauthorizedAccess';

export interface AuditLogParams {
  groupId: string;
  actorUid: string;
  action: AuditAction;
  itemId?: string;
  details?: Record<string, unknown>;
  /** リクエストオブジェクト（IPアドレス・ユーザーエージェント取得用） */
  request?: NextRequest;
  /** エラー情報（エラー発生時） */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  /** セキュリティイベントフラグ */
  securityEvent?: boolean;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  const db = getDb();
  const col = db.collection('auditLogs');
  const docRef = col.doc();
  const now = new Date().toISOString();

  // IPアドレスとユーザーエージェントを取得
  const ipAddress = params.request ? getIpAddress(params.request) : null;
  const userAgent = params.request ? getUserAgent(params.request) : null;

  const doc: AuditLogDoc = {
    id: docRef.id,
    groupId: params.groupId,
    itemId: params.itemId ?? null,
    actorUid: params.actorUid,
    action: params.action,
    details: params.details,
    createdAt: now,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    error: params.error,
    securityEvent: params.securityEvent ?? false,
  };
  await docRef.set(doc);
}
