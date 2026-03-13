/**
 * GET: 監査ログ一覧（フィルタリング、ソート、ページネーション対応）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { AuditLogDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { createErrorResponse, ErrorCode } from '@/lib/api/error-response';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      createErrorResponse(ErrorCode.UNAUTHORIZED, 'Unauthorized'),
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || undefined;
    const actorUid = searchParams.get('actorUid') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // ユーザーがアクセス可能なグループのみフィルタ
    const db = getDb();
    const membersSnap = await db
      .collection(COLLECTIONS.groupMembers)
      .where('userId', '==', session.uid)
      .get();
    const accessibleGroupIds = membersSnap.docs.map((d) => d.data().groupId);

    if (accessibleGroupIds.length === 0) {
      return NextResponse.json({
        logs: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      });
    }

    // クエリ構築
    // グループIDでフィルタ（指定されている場合）
    let query = db.collection(COLLECTIONS.auditLogs);
    if (groupId && accessibleGroupIds.includes(groupId)) {
      query = query.where('groupId', '==', groupId);
    } else if (accessibleGroupIds.length > 0) {
      // アクセス可能なグループが10件以下の場合のみ'in'を使用
      if (accessibleGroupIds.length <= 10) {
        query = query.where('groupId', 'in', accessibleGroupIds);
      } else {
        // 10件を超える場合は、最初の10件のみフィルタ（簡略化）
        query = query.where('groupId', 'in', accessibleGroupIds.slice(0, 10));
      }
    } else {
      // アクセス可能なグループがない場合は空の結果を返す
      return NextResponse.json({
        logs: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      });
    }

    // ユーザーIDでフィルタ
    if (actorUid) {
      query = query.where('actorUid', '==', actorUid);
    }

    // 操作種別でフィルタ
    if (action) {
      query = query.where('action', '==', action);
    }

    // 日付範囲でフィルタ
    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    // ソート
    const orderByField = sortBy === 'actorUid' ? 'actorUid' : 'createdAt';
    query = query.orderBy(orderByField, sortOrder === 'asc' ? 'asc' : 'desc');

    // ページネーション
    query = query.limit(limit).offset(offset);

    const logsSnap = await query.get();
    const logs = logsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLogDoc[];

    // 総件数を取得（簡略化のため、フィルタ後の件数のみ）
    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch audit logs'
      ),
      { status: 500 }
    );
  }
}
