import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { GroupMemberDoc, ItemDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { encryptItemPayload, decryptItemPayload } from '@/lib/items/encryption';
import type { ItemPayload } from '@/lib/items/types';

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

  const itemsSnap = await db
    .collection(COLLECTIONS.items)
    .where('groupId', '==', params.id)
    .orderBy('createdAt', 'desc')
    .get();

  const items = itemsSnap.docs
    .map((doc) => doc.data() as ItemDoc)
    .filter((doc) => !doc.deletedAt)
    .map((doc) => {
      let title = '';
      let type = 'other';
      try {
        const payload = decryptItemPayload({ ciphertext: doc.ciphertext, iv: doc.iv });
        title = payload.title;
        type = payload.type;
      } catch {
        title = '(復号エラー)';
        type = 'other';
      }
      return {
        id: doc.id,
        title,
        type,
        updatedAt: doc.updatedAt,
      };
    });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
  const docRef = db.collection(COLLECTIONS.items).doc();
  const item: ItemDoc = {
    id: docRef.id,
    groupId: params.id,
    createdBy: session.uid,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ciphertext,
    iv,
  };

  await docRef.set(item);

  return NextResponse.json(
    {
      id: item.id,
      title: payload.title,
      type: payload.type,
      updatedAt: item.updatedAt,
    },
    { status: 201 }
  );
}
