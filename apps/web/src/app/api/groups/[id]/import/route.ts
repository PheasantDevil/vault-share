import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { ItemDoc } from '@vault-share/db';
import { parseCSVToItems } from '@/lib/csv/parser';
import { encryptItemPayload } from '@/lib/items/encryption';
import { writeAuditLog } from '@/lib/audit/log';

async function ensureMember(groupId: string, userId: string) {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].data();
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;

    // グループの存在確認と権限チェック
    const db = getDb();
    const groupDoc = await db.collection(COLLECTIONS.groups).doc(groupId).get();
    if (!groupDoc.exists) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const member = await ensureMember(groupId, session.uid);
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

    // CSVファイルを読み込み
    const csvText = await file.text();

    // CSVをパース
    let parsedItems;
    try {
      parsedItems = parseCSVToItems(csvText);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to parse CSV' },
        { status: 400 }
      );
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: 'No items found in CSV' }, { status: 400 });
    }

    // アイテムを登録
    const batch = db.batch();
    const createdItems: string[] = [];
    const now = new Date().toISOString();

    for (const itemPayload of parsedItems) {
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
    }

    await batch.commit();

    // 監査ログを記録
    for (const itemId of createdItems) {
      await writeAuditLog({
        groupId,
        actorUid: session.uid,
        action: 'item.create',
        itemId,
        details: {
          imported: true,
          source: 'csv',
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      items: createdItems,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
