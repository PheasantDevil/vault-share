import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc, ItemDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { encryptItemPayload, decryptItemPayload } from '@/lib/items/encryption';
import type { ItemPayload } from '@/lib/items/types';
import { writeAuditLog } from '@/lib/audit/log';
import { createErrorResponse, ErrorCode } from '@/lib/api/error-response';

async function ensureMember(groupId: string, userId: string): Promise<GroupMemberDoc | null> {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as GroupMemberDoc);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      createErrorResponse(ErrorCode.UNAUTHORIZED, '認証が必要です'),
      { status: 401 }
    );
  }
  const db = getDb();
  const member = await ensureMember(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      createErrorResponse(ErrorCode.FORBIDDEN, 'このグループにアクセスする権限がありません'),
      { status: 403 }
    );
  }

  // クエリパラメータの取得
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // 最大100件
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
  const searchQuery = searchParams.get('search')?.trim() || '';
  const typeFilter = searchParams.get('type')?.trim() || '';

  try {
    // ベースクエリ
    let query = db
      .collection(COLLECTIONS.items)
      .where('groupId', '==', params.id)
      .orderBy('createdAt', 'desc');

    // ページネーション適用
    query = query.limit(limit).offset(offset);

    const itemsSnap = await query.get();

    // 全件数を取得（ページネーション用）
    const totalSnap = await db
      .collection(COLLECTIONS.items)
      .where('groupId', '==', params.id)
      .get();

    const allItems = itemsSnap.docs
      .map((doc) => doc.data() as ItemDoc)
      .filter((doc) => !doc.deletedAt)
      .map((doc) => {
        let title = '';
        let type = 'other';
        try {
          const payload = decryptItemPayload({ ciphertext: doc.ciphertext, iv: doc.iv });
          title = payload.title;
          type = payload.type;
        } catch {
          title = '(復号エラー)';
          type = 'other';
        }
        return {
          id: doc.id,
          title,
          type,
          updatedAt: doc.updatedAt,
        };
      });

    // サーバー側検索フィルタリング（タイトル検索）
    let filteredItems = allItems;
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.title.toLowerCase().includes(queryLower)
      );
    }

    // タイプフィルタリング
    if (typeFilter && typeFilter !== 'all') {
      filteredItems = filteredItems.filter((item) => item.type === typeFilter);
    }

    // 全件数（フィルタ適用前）
    const total = totalSnap.docs.filter((doc) => !doc.data().deletedAt).length;

    return NextResponse.json({
      items: filteredItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'アイテムの取得に失敗しました',
        { originalError: err instanceof Error ? err.message : String(err) }
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      createErrorResponse(ErrorCode.UNAUTHORIZED, '認証が必要です'),
      { status: 401 }
    );
  }

  const db = getDb();
  const member = await ensureMember(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      createErrorResponse(ErrorCode.FORBIDDEN, 'このグループにアクセスする権限がありません'),
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as Partial<ItemPayload>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const type =
      body.type === 'password' || body.type === 'note' || body.type === 'key' || body.type === 'other'
        ? body.type
        : 'other';
    const value = typeof body.value === 'string' ? body.value : '';
    const note = typeof body.note === 'string' ? body.note : undefined;

    if (!title || !value) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'タイトルと内容は必須です', {
          fields: {
            title: title ? undefined : 'タイトルは必須です',
            value: value ? undefined : '内容は必須です',
          },
        }),
        { status: 400 }
      );
    }

    const payload: ItemPayload = { title, type, value, note };
    const { ciphertext, iv } = encryptItemPayload(payload);
    const now = new Date().toISOString();
    const docRef = db.collection(COLLECTIONS.items).doc();
    const item: ItemDoc = {
      id: docRef.id,
      groupId: params.id,
      createdBy: session.uid,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ciphertext,
      iv,
    };

    await docRef.set(item);
    await writeAuditLog({
      groupId: params.id,
      actorUid: session.uid,
      action: 'item.create',
      itemId: item.id,
      details: { title: payload.title, type: payload.type },
    });

    return NextResponse.json(
      {
        id: item.id,
        title: payload.title,
        type: payload.type,
        updatedAt: item.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'アイテムの作成に失敗しました',
        { originalError: err instanceof Error ? err.message : String(err) }
      ),
      { status: 500 }
    );
  }
}
