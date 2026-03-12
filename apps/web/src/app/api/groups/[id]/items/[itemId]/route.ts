import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc, ItemDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { decryptItemPayload, encryptItemPayload } from '@/lib/items/encryption';
import type { ItemPayload } from '@/lib/items/types';
import { writeAuditLog } from '@/lib/audit/log';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const member = await ensureMember(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      { error: 'このグループにアクセスする権限がありません' },
      { status: 403 }
    );
  }

  const docSnap = await db.collection(COLLECTIONS.items).doc(params.itemId).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }
  const doc = docSnap.data() as ItemDoc;
  if (doc.groupId !== params.id || doc.deletedAt) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }

  try {
    const payload = decryptItemPayload({ ciphertext: doc.ciphertext, iv: doc.iv });
    return NextResponse.json({
      id: doc.id,
      groupId: doc.groupId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      payload,
    });
  } catch {
    return NextResponse.json({ error: 'アイテムの復号に失敗しました' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const member = await ensureMember(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      { error: 'このグループにアクセスする権限がありません' },
      { status: 403 }
    );
  }

  const docSnap = await db.collection(COLLECTIONS.items).doc(params.itemId).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }
  const doc = docSnap.data() as ItemDoc;
  if (doc.groupId !== params.id || doc.deletedAt) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }

  const body = (await request.json()) as Partial<ItemPayload>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const type =
    body.type === 'password' || body.type === 'note' || body.type === 'key' || body.type === 'other'
      ? body.type
      : 'other';
  const value = typeof body.value === 'string' ? body.value : '';
  const note = typeof body.note === 'string' ? body.note : undefined;

  if (!title || !value) {
    return NextResponse.json({ error: 'タイトルと内容は必須です' }, { status: 400 });
  }

  const payload: ItemPayload = { title, type, value, note };
  const { ciphertext, iv } = encryptItemPayload(payload);
  const now = new Date().toISOString();

  await db.collection(COLLECTIONS.items).doc(params.itemId).update({
    ciphertext,
    iv,
    updatedAt: now,
  });
  await writeAuditLog({
    groupId: params.id,
    actorUid: session.uid,
    action: 'item.update',
    itemId: params.itemId,
    details: { title, type },
    request,
  });

  return NextResponse.json({ id: params.itemId, updatedAt: now });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const member = await ensureMember(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      { error: 'このグループにアクセスする権限がありません' },
      { status: 403 }
    );
  }

  const docSnap = await db.collection(COLLECTIONS.items).doc(params.itemId).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }
  const doc = docSnap.data() as ItemDoc;
  if (doc.groupId !== params.id || doc.deletedAt) {
    return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 });
  }

  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.items).doc(params.itemId).update({ deletedAt: now });
  await writeAuditLog({
    groupId: params.id,
    actorUid: session.uid,
    action: 'item.delete',
    itemId: params.itemId,
    request,
  });

  return NextResponse.json({ id: params.itemId, deletedAt: now });
}
