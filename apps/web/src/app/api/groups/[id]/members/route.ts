/**
 * GET: グループメンバー一覧
 * PATCH: メンバーのロール変更
 * DELETE: メンバー削除
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc } from '@vault-share/db';
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
  return memberSnap.empty ? null : (memberSnap.docs[0].data() as GroupMemberDoc);
}

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
  const member = await ensureMember(db, params.id, session.uid);
  if (!member) {
    return NextResponse.json(
      { error: 'このグループにアクセスする権限がありません' },
      { status: 403 }
    );
  }
  const membersSnap = await db
    .collection(COLLECTIONS.groupMembers)
    .where('groupId', '==', params.id)
    .get();
  const members = membersSnap.docs.map((d) => {
    const data = d.data() as GroupMemberDoc;
    return { id: d.id, ...data };
  });
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const actingMember = await ensureMember(db, params.id, session.uid);
  if (!actingMember || actingMember.role !== 'owner') {
    return NextResponse.json(
      { error: 'メンバーのロールを変更する権限がありません' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const role =
    body.role === 'owner' || body.role === 'member' ? (body.role as GroupMemberDoc['role']) : null;
  if (!userId || !role) {
    return NextResponse.json({ error: 'userId と role は必須です' }, { status: 400 });
  }

  try {
    await db.runTransaction(async (tx) => {
      const membersSnap = await tx.get(
        db.collection(COLLECTIONS.groupMembers).where('groupId', '==', params.id)
      );
      const members = membersSnap.docs.map((d) => d.data() as GroupMemberDoc);
      const targetDoc = membersSnap.docs.find(
        (d) => (d.data() as GroupMemberDoc).userId === userId
      );
      if (!targetDoc) {
        throw new Error('メンバーが見つかりません');
      }
      const target = targetDoc.data() as GroupMemberDoc;

      if (target.role === role) {
        return;
      }

      const ownerCount = members.filter((m) => m.role === 'owner').length;
      // 最後のオーナーを member に落とすのは NG
      if (target.role === 'owner' && role === 'member' && ownerCount <= 1) {
        throw new Error('少なくとも1人のオーナーが必要です');
      }

      tx.update(targetDoc.ref, { role });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ロールの更新に失敗しました';
    const status = message.includes('オーナーが必要')
      ? 400
      : message.includes('メンバーが見つかりません')
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const actingMember = await ensureMember(db, params.id, session.uid);
  if (!actingMember || actingMember.role !== 'owner') {
    return NextResponse.json({ error: 'メンバーを削除する権限がありません' }, { status: 403 });
  }

  const body = await request.json();
  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!userId) {
    return NextResponse.json({ error: 'userId は必須です' }, { status: 400 });
  }

  // 自分自身の削除は許可しない（グループ削除フローを使う）
  if (userId === session.uid) {
    return NextResponse.json(
      { error: '自分自身を削除する場合はグループ削除または別のフローを使用してください' },
      { status: 400 }
    );
  }

  try {
    await db.runTransaction(async (tx) => {
      const membersSnap = await tx.get(
        db.collection(COLLECTIONS.groupMembers).where('groupId', '==', params.id)
      );
      const members = membersSnap.docs.map((d) => d.data() as GroupMemberDoc);
      const targetDoc = membersSnap.docs.find(
        (d) => (d.data() as GroupMemberDoc).userId === userId
      );
      if (!targetDoc) {
        throw new Error('メンバーが見つかりません');
      }
      const target = targetDoc.data() as GroupMemberDoc;

      const ownerCount = members.filter((m) => m.role === 'owner').length;
      // 最後のオーナーを削除するのは NG
      if (target.role === 'owner' && ownerCount <= 1) {
        throw new Error('少なくとも1人のオーナーが必要です');
      }

      tx.delete(targetDoc.ref);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'メンバーの削除に失敗しました';
    const status = message.includes('オーナーが必要')
      ? 400
      : message.includes('メンバーが見つかりません')
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true });
}
