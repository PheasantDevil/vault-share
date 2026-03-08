/**
 * POST: 招待トークン発行
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { InvitationDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';

async function ensureMember(
  db: Awaited<ReturnType<typeof getDb>>,
  groupId: string,
  userId: string
) {
  const memberSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  return memberSnap.empty ? null : memberSnap.docs[0].data();
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json(
      { error: 'このグループに招待を発行する権限がありません' },
      { status: 403 }
    );
  }
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const invRef = db.collection(COLLECTIONS.invitations).doc();
  const invDoc: InvitationDoc = {
    id: invRef.id,
    groupId: params.id,
    invitedBy: session.uid,
    token,
    expiresAt,
    usedAt: null,
    createdAt: now.toISOString(),
  };
  await invRef.set(invDoc);
  const baseUrl = request.nextUrl.origin;
  const inviteLink = `${baseUrl}/invite?token=${token}`;
  return NextResponse.json({ token, inviteLink, expiresAt });
}
