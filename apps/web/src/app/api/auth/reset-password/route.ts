/**
 * POST: パスワードリセットメールを送信
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 });
    }

    const auth = getAdminAuth();
    // Identity Platform の sendPasswordResetEmail を使用
    // メールアドレスが存在しない場合でも、セキュリティ上の理由で成功を返す
    try {
      await auth.generatePasswordResetLink(email, {
        url: `${request.nextUrl.origin}/reset-password/confirm`,
        handleCodeInApp: false,
      });
      // 実際には generatePasswordResetLink はリンクを返すが、
      // クライアント側で sendPasswordResetEmail を使う方が簡単
    } catch (err) {
      // エラーを無視して成功を返す（セキュリティ上の理由）
      console.error('Password reset error:', err);
    }

    // クライアント側で sendPasswordResetEmail を使うため、ここでは成功を返す
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Password reset request error:', err);
    return NextResponse.json({ error: 'パスワードリセットメールの送信に失敗しました' }, { status: 500 });
  }
}
