import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { ItemDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { decryptItemPayload, encryptItemPayload } from '@/lib/items/encryption';
import type { ItemPayload } from '@/lib/items/types';
import { normalizeItemPayloadFromRequest } from '@/lib/items/normalize-item-payload';
import { writeAuditLog } from '@/lib/audit/log';
import { getGroupMembership } from '@/lib/groups/get-group-membership';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const member = await getGroupMembership(params.id, session.uid);
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
  const member = await getGroupMembership(params.id, session.uid);
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

  const body = await request.json();
  const normalized = normalizeItemPayloadFromRequest(body);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.message }, { status: 400 });
  }

  const payload: ItemPayload = normalized.payload;
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
    details: { title: payload.title, type: payload.type },
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
  const member = await getGroupMembership(params.id, session.uid);
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
