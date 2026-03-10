'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await getFirebaseAuthAsync();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'ログインに失敗しました。');
        return;
      }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : err instanceof Error
            ? err.message
            : '';
      if (code.includes('auth/unauthorized-domain')) {
        setError(
          'このドメインは Firebase の承認済みドメインに含まれていません。管理者に連絡してください。'
        );
      } else if (code.includes('auth/invalid-api-key') || code.includes('auth/api-key-not-valid')) {
        setError('Firebase の設定が正しくありません。管理者に連絡してください。');
      } else if (typeof code === 'string' && code.includes('auth/')) {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>ログイン</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        メール/パスワードでログイン（許可されたメールアドレスのみ）
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
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 0.25 }}>
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/signup">新規登録</Link> / <Link href="/reset-password">パスワードを忘れた場合</Link> / <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}
