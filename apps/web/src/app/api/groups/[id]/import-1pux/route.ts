import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { ItemDoc } from '@vault-share/db';
import { parse1PuxToItems } from '@/lib/1pux/parser';
import { encryptItemPayload } from '@/lib/items/encryption';
import { writeAuditLog } from '@/lib/audit/log';
import { checkRateLimit, createRateLimitResponse, createUserRateLimitKey } from '@/lib/rate-limit';
import { processBatch } from '@/lib/batch/processor';
import type { ItemPayload } from '@/lib/items/types';
import { getGroupMembership } from '@/lib/groups/get-group-membership';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // レート制限チェック（ユーザーIDベース、1時間に10回まで）
    const rateLimitResult = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 10,
      keyGenerator: () => createUserRateLimitKey(session.uid, 'import-1pux'),
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

    // FormDataからファイルを取得
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // 1PUX JSONファイルを読み込み
    const jsonText = await file.text();

    // 1PUX JSONをパース
    let parsedItems;
    try {
      parsedItems = parse1PuxToItems(jsonText);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to parse 1PUX JSON' },
        { status: 400 }
      );
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'No items found in 1PUX file' }, { status: 400 });
    }

    // アイテムをバッチで登録
    const createdItems: string[] = [];
    const now = new Date().toISOString();

    await processBatch(
      parsedItems,
      (batch, itemPayload: ItemPayload, index) => {
        const itemRef = db.collection(COLLECTIONS.items).doc();
        const { ciphertext, iv } = encryptItemPayload(itemPayload);

        const item: Omit<ItemDoc, 'id'> = {
          groupId,
          createdBy: session.uid,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          ciphertext,
          iv,
        };

        batch.set(itemRef, item);
        createdItems.push(itemRef.id);
      },
      {
        batchSize: 500, // Firestoreのバッチ制限
        onProgress: (current, total) => {
          // 進捗ログ（必要に応じて拡張可能）
          if (current % 100 === 0 || current === total) {
            console.log(`1PUX import progress: ${current}/${total}`);
          }
        },
        onError: (error, item) => {
          console.error(`Failed to import item:`, error, item);
        },
      }
    );

    // 監査ログを記録（並列実行）
    const auditLogPromises: Promise<void>[] = [];
    for (const itemId of createdItems) {
      auditLogPromises.push(
        writeAuditLog({
          groupId,
          actorUid: session.uid,
          action: 'item.create',
          itemId,
          details: {
            imported: true,
            source: '1pux',
          },
          request,
        })
      );
    }
    await Promise.all(auditLogPromises);

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      items: createdItems,
    });
  } catch (error) {
    console.error('1PUX import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
