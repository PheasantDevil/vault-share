/**
 * GET: 監査ログCSVエクスポート
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { AuditLogDoc, GroupMemberDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { createErrorResponse, ErrorCode } from '@/lib/api/error-response';
import type { Query } from 'firebase-admin/firestore';

/**
 * CSV形式に変換
 */
function formatAuditLogsToCSV(logs: AuditLogDoc[]): string {
  const headers = [
    'ID',
    'グループID',
    'アイテムID',
    '実行ユーザーID',
    '操作',
    'IPアドレス',
    'ユーザーエージェント',
    '作成日時',
    '詳細',
    'エラー',
    'セキュリティイベント',
  ];

  const rows = logs.map((log) => {
    return [
      log.id,
      log.groupId,
      log.itemId || '',
      log.actorUid,
      log.action,
      log.ipAddress || '',
      log.userAgent || '',
      log.createdAt,
      log.details ? JSON.stringify(log.details) : '',
      log.error ? JSON.stringify(log.error) : '',
      log.securityEvent ? 'true' : 'false',
    ].map((field) => {
      // CSVエスケープ
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED, 'Unauthorized'), {
      status: 401,
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || undefined;
    const actorUid = searchParams.get('actorUid') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const db = getDb();
    const membersSnap = await db
      .collection(COLLECTIONS.groupMembers)
      .where('userId', '==', session.uid)
      .get();
    const ownedGroupIds = membersSnap.docs
      .map((d) => d.data() as GroupMemberDoc)
      .filter((m) => m.role === 'owner')
      .map((m) => m.groupId);

    if (groupId && !ownedGroupIds.includes(groupId)) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.FORBIDDEN,
          'このグループの監査ログをエクスポートする権限がありません'
        ),
        { status: 403 }
      );
    }

    if (ownedGroupIds.length === 0) {
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        },
      });
    }

    // クエリ構築（エクスポートは最大1000件まで）
    let query: Query = db.collection(COLLECTIONS.auditLogs);

    if (groupId && ownedGroupIds.includes(groupId)) {
      query = query.where('groupId', '==', groupId);
    } else if (ownedGroupIds.length <= 10) {
      query = query.where('groupId', 'in', ownedGroupIds);
    } else {
      query = query.where('groupId', 'in', ownedGroupIds.slice(0, 10));
    }
    if (actorUid) {
      query = query.where('actorUid', '==', actorUid);
    }
    if (action) {
      query = query.where('action', '==', action);
    }
    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    query = query.orderBy('createdAt', 'desc').limit(1000);

    const logsSnap = await query.get();
    const logs = logsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLogDoc[];

    const csv = formatAuditLogsToCSV(logs);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Audit logs export error:', error);
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to export audit logs'),
      { status: 500 }
    );
  }
}
