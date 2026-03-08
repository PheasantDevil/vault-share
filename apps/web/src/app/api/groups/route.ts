/**
 * GET: 参加中のグループ一覧
 * POST: グループ作成
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupDoc, GroupMemberDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const membersSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('userId', '==', session.uid)
    .get();
  const groupIds = membersSnap.docs.map((d) => (d.data() as GroupMemberDoc).groupId);
  if (groupIds.length === 0) {
    return NextResponse.json({ groups: [] });
  }
  const groupsSnap = await db.collection(COLLECTIONS.groups).get();
  const groups = groupsSnap.docs
    .filter((d) => groupIds.includes(d.id))
    .map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'グループ名は必須です' }, { status: 400 });
  }
  const db = getDb();
  const groupRef = db.collection(COLLECTIONS.groups).doc();
  const now = new Date().toISOString();
  const groupDoc: GroupDoc = {
    id: groupRef.id,
    name,
    createdBy: session.uid,
    createdAt: now,
    updatedAt: now,
  };
  await groupRef.set(groupDoc);
  const memberRef = db.collection(COLLECTIONS.groupMembers).doc();
  const memberDoc: GroupMemberDoc = {
    groupId: groupRef.id,
    userId: session.uid,
    role: 'owner',
    joinedAt: now,
  };
  await memberRef.set({ ...memberDoc });
  return NextResponse.json(groupDoc);
}
