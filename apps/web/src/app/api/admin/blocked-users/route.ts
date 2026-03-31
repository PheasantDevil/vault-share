/**
 * ブロックリスト（blockedUsers）の一覧・追加・削除。ADMIN_EMAILS に含まれるユーザーのみ。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { BlockedUserDoc } from '@vault-share/db';
import { getSessionFromRequest } from '@/lib/auth/get-session';
import { isAdminEmail, isAdminConfigured } from '@/lib/auth/admin-emails';
import { normalizeEmailForBlocklist } from '@/lib/auth/blocked-users';

const LIST_LIMIT = 500;

function unauthorized() {
  return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: '権限がありません。' }, { status: 403 });
}

function adminNotConfigured() {
  return NextResponse.json(
    { error: '管理 API が未設定です。環境変数 ADMIN_EMAILS を設定してください。' },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (!isAdminConfigured()) {
    return adminNotConfigured();
  }
  if (!isAdminEmail(session.email)) return forbidden();

  const db = getDb();
  const snap = await db.collection(COLLECTIONS.blockedUsers).limit(LIST_LIMIT).get();
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as BlockedUserDoc),
  }));
  return NextResponse.json({ blockedUsers: items });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (!isAdminConfigured()) {
    return adminNotConfigured();
  }
  if (!isAdminEmail(session.email)) return forbidden();

  let body: { email?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON が不正です。' }, { status: 400 });
  }
  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const normalized = normalizeEmailForBlocklist(emailRaw);
  if (!normalized || !normalized.includes('@')) {
    return NextResponse.json({ error: '有効なメールアドレスを指定してください。' }, { status: 400 });
  }

  if (normalized === normalizeEmailForBlocklist(session.email ?? '')) {
    return NextResponse.json({ error: '自分自身をブロックリストに追加できません。' }, { status: 400 });
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const now = new Date().toISOString();
  const doc: BlockedUserDoc = {
    email: normalized,
    blockedAt: now,
    blockedByUid: session.uid,
  };
  if (reason) doc.reason = reason;

  const db = getDb();
  await db.collection(COLLECTIONS.blockedUsers).doc(normalized).set(doc);
  return NextResponse.json({ ok: true, id: normalized });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (!isAdminConfigured()) {
    return adminNotConfigured();
  }
  if (!isAdminEmail(session.email)) return forbidden();

  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email') ?? '';
  const normalized = normalizeEmailForBlocklist(emailParam);
  if (!normalized) {
    return NextResponse.json({ error: 'query パラメータ email が必要です。' }, { status: 400 });
  }

  const db = getDb();
  await db.collection(COLLECTIONS.blockedUsers).doc(normalized).delete();
  return NextResponse.json({ ok: true });
}
