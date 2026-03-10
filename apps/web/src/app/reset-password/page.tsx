'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await getFirebaseAuthAsync();
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/reset-password/confirm`,
        handleCodeInApp: false,
      });
      setSent(true);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code.includes('auth/user-not-found')) {
        // セキュリティ上の理由で、ユーザーが存在しない場合でも成功を表示
        setSent(true);
      } else if (code.includes('auth/invalid-email')) {
        setError('メールアドレスの形式が正しくありません。');
      } else {
        setError(err instanceof Error ? err.message : 'パスワードリセットメールの送信に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem' }}>メールを送信しました</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。
        </p>
        <p>
          <Link href="/login">ログインページへ戻る</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>パスワードリセット</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        メールアドレスを入力してください。パスワードリセット用のリンクを送信します。
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 0.25 }}>
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? '送信中...' : '送信'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/login">ログインページへ戻る</Link>
      </p>
    </main>
  );
}
