'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? '登録に失敗しました。');
        return;
      }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登録に失敗しました。';
      if (typeof message === 'string' && message.includes('auth/email-already-in-use')) {
        setError('このメールアドレスは既に登録されています。ログインしてください。');
      } else if (typeof message === 'string' && message.includes('auth/')) {
        setError('入力内容を確認してください。');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>新規登録</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        メール/パスワードで登録（許可されたメールアドレスのみ）
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
            autoComplete="new-password"
            minLength={6}
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="displayName" style={{ display: 'block', marginBottom: 0.25 }}>
            表示名（任意）
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? '登録中...' : '登録'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/login">ログイン</Link> / <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}
