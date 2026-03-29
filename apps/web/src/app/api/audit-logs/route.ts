/**
 * GET: 監査ログ一覧（フィルタリング、ソート、ページネーション対応）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { AuditLogDoc, GroupMemberDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { createErrorResponse, ErrorCode } from '@/lib/api/error-response';
import type { Query } from 'firebase-admin/firestore';

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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // オーナーとして管理できるグループのログのみ（メンバー権限では閲覧不可）
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
          'このグループの監査ログを閲覧する権限がありません'
        ),
        { status: 403 }
      );
    }

    if (ownedGroupIds.length === 0) {
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

    // Firestore の in は最大 30 要素。それを超えるオーナーグループがある場合は groupId で絞り込み必須
    if (!groupId && ownedGroupIds.length > 30) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          '監査ログを閲覧するグループが多すぎます。グループを指定してフィルタしてください。'
        ),
        { status: 400 }
      );
    }

    // クエリ構築
    // グループIDでフィルタ（指定されている場合）
    let query: Query = db.collection(COLLECTIONS.auditLogs);
    if (groupId && ownedGroupIds.includes(groupId)) {
      query = query.where('groupId', '==', groupId);
    } else {
      query = query.where('groupId', 'in', ownedGroupIds);
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
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch audit logs'),
      { status: 500 }
    );
  }
}
