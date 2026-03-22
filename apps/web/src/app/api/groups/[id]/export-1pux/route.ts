import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { ItemDoc } from '@vault-share/db';
import { decryptItemPayload } from '@/lib/items/encryption';
import { exportItemsTo1Pux } from '@/lib/1pux/exporter';
import type { ItemPayload } from '@/lib/items/types';
import { checkRateLimit, createRateLimitResponse, createUserRateLimitKey } from '@/lib/rate-limit';
import { getGroupMembership } from '@/lib/groups/get-group-membership';
import { getItemSnapshotsByGroupId } from '@/lib/items/query-items-by-group';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // レート制限チェック（ユーザーIDベース、1時間に20回まで）
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 20,
      keyGenerator: () => createUserRateLimitKey(session.uid, 'export-1pux'),
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const groupId = params.id;

    // グループの存在確認と権限チェック
    const db = getDb();
    const groupDoc = await db.collection(COLLECTIONS.groups).doc(groupId).get();
    if (!groupDoc.exists) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const member = await getGroupMembership(groupId, session.uid);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const itemsSnapshot = await getItemSnapshotsByGroupId(db, groupId);
    const sortedDocs = [...itemsSnapshot.docs].sort((a, b) => {
      const ca = (a.data() as ItemDoc).createdAt;
      const cb = (b.data() as ItemDoc).createdAt;
      return cb.localeCompare(ca);
    });

    // アイテムを復号
    const itemPayloads: ItemPayload[] = [];
    for (const itemDoc of sortedDocs) {
      const data = itemDoc.data() as ItemDoc;
      if (data.deletedAt) continue;
      try {
        const payload = decryptItemPayload({
          ciphertext: data.ciphertext,
          iv: data.iv,
        });
        itemPayloads.push(payload);
      } catch (error) {
        console.error(`Failed to decrypt item ${itemDoc.id}:`, error);
        // 復号に失敗したアイテムはスキップ
      }
    }

    // 1PUX JSONに変換
    const jsonContent = exportItemsTo1Pux(itemPayloads);

    // JSONファイルとして返す
    return new NextResponse(jsonContent, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="vault-share-export-${groupId}-${new Date().toISOString().split('T')[0]}.1pux"`,
      },
    });
  } catch (error) {
    console.error('1PUX export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
