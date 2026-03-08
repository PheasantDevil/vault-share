/**
 * GET: グループメンバー一覧
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';

async function ensureMember(db: Awaited<ReturnType<typeof getDb>>, groupId: string, userId: string) {
  const memberSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  return memberSnap.empty ? null : (memberSnap.docs[0].data() as GroupMemberDoc);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const member = await ensureMember(db, params.id, session.uid);
  if (!member) {
    return NextResponse.json({ error: 'このグループにアクセスする権限がありません' }, { status: 403 });
  }
  const membersSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', params.id)
    .get();
  const members = membersSnap.docs.map((d) => {
    const data = d.data() as GroupMemberDoc;
    return { id: d.id, ...data };
  });
  const userIds = [...new Set(members.map((m) => m.userId))];
  const usersSnap = await db.collection(COLLECTIONS.users).get();
  const userMap = new Map(
    usersSnap.docs.map((d) => [d.id, d.data() as { displayName?: string; email?: string }])
  );
  const membersWithUser = members.map((m) => {
    const u = userMap.get(m.userId);
    return { ...m, displayName: u?.displayName, email: u?.email };
  });
  return NextResponse.json({ members: membersWithUser });
}
