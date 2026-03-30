/**
 * GET: ログインユーザーのプロフィールと参加グループ（ロール付き）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupDoc, GroupMemberDoc, UserDoc } from '@vault-share/db';
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

  const memberRows = membersSnap.docs.map((d) => d.data() as GroupMemberDoc);
  const groupIds = [...new Set(memberRows.map((m) => m.groupId))];

  const groupSnaps =
    groupIds.length > 0
      ? await db.getAll(...groupIds.map((id) => db.collection(COLLECTIONS.groups).doc(id)))
      : [];

  const nameById = new Map<string, string>();
  for (const snap of groupSnaps) {
    if (snap.exists) {
      const g = snap.data() as GroupDoc;
      nameById.set(snap.id, g.name ?? '');
    }
  }

  const groups = memberRows.map((m) => ({
    id: m.groupId,
    name: nameById.get(m.groupId) ?? '',
    role: m.role,
  }));

  const isOwnerOfAnyGroup = groups.some((g) => g.role === 'owner');

  const userSnap = await db.collection(COLLECTIONS.users).doc(session.uid).get();
  const userData = userSnap.exists ? (userSnap.data() as UserDoc) : null;

  return NextResponse.json(
    {
      user: {
        uid: session.uid,
        email: session.email ?? userData?.email ?? null,
        displayName: userData?.displayName ?? null,
      },
      groups,
      isOwnerOfAnyGroup,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
}
