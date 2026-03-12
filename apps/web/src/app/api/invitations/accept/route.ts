/**
 * POST: 招待トークンでグループに参加
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'ログインしてください' }, { status: 401 });
  }
  const body = await request.json();
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ error: '招待トークンが必要です' }, { status: 400 });
  }
  const db = getDb();
  const invSnap = await db
    .collection(COLLECTIONS.invitations)
    .where('token', '==', token)
    .limit(1)
    .get();
  if (invSnap.empty) {
    return NextResponse.json({ error: '招待が見つかりません' }, { status: 404 });
  }
  const invDoc = invSnap.docs[0];
  const inv = invDoc.data();
  if (inv.usedAt) {
    return NextResponse.json({ error: 'この招待は既に使用されています' }, { status: 400 });
  }
  const now = new Date();
  if (new Date(inv.expiresAt) < now) {
    return NextResponse.json({ error: '招待の有効期限が切れています' }, { status: 400 });
  }
  const groupId = inv.groupId;
  const existingSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', groupId)
    .where('userId', '==', session.uid)
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    await db
      .collection(COLLECTIONS.invitations)
      .doc(invDoc.id)
      .update({ usedAt: now.toISOString() });
    return NextResponse.json({ groupId, message: '既に参加済みです' });
  }
  const memberRef = db.collection(COLLECTIONS.groupMembers).doc();
  const memberDoc: GroupMemberDoc = {
    groupId,
    userId: session.uid,
    role: 'member',
    joinedAt: now.toISOString(),
  };
  await memberRef.set({ ...memberDoc, id: memberRef.id });
  await db.collection(COLLECTIONS.invitations).doc(invDoc.id).update({ usedAt: now.toISOString() });
  await writeAuditLog({
    groupId,
    actorUid: session.uid,
    action: 'member.add',
    request,
    details: { invitedBy: inv.invitedBy, role: 'member' },
  });
  return NextResponse.json({ groupId });
}
