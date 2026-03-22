/**
 * GET: グループ詳細
 * PATCH: グループ更新
 * DELETE: グループ削除
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { writeAuditLog } from '@/lib/audit/log';
import { getGroupMembership } from '@/lib/groups/get-group-membership';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const groupRef = db.collection(COLLECTIONS.groups).doc(params.id);
  const groupSnap = await groupRef.get();
  if (!groupSnap.exists) {
    return NextResponse.json({ error: 'グループが見つかりません' }, { status: 404 });
  }
  const member = await getGroupMembership(params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      { error: 'このグループにアクセスする権限がありません' },
      { status: 403 }
    );
  }
  return NextResponse.json(
    { id: groupSnap.id, ...groupSnap.data() },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    }
  );
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const member = await getGroupMembership(params.id, session.uid);
  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'グループを編集する権限がありません' }, { status: 403 });
  }
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : null;
  if (name === null || name === '') {
    return NextResponse.json({ error: 'グループ名は必須です' }, { status: 400 });
  }
  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.groups).doc(params.id).update({ name, updatedAt: now });
  await writeAuditLog({
    groupId: params.id,
    actorUid: session.uid,
    action: 'group.updateName',
    details: { name },
    request,
  });
  return NextResponse.json({ id: params.id, name, updatedAt: now });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const member = await getGroupMembership(params.id, session.uid);
  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'グループを削除する権限がありません' }, { status: 403 });
  }
  const batch = db.batch();
  const membersSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', params.id)
    .get();
  membersSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection(COLLECTIONS.groups).doc(params.id));
  await batch.commit();
  await writeAuditLog({
    groupId: params.id,
    actorUid: session.uid,
    action: 'group.delete',
    request,
  });
  return NextResponse.json({ ok: true });
}
