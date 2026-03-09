'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

function getAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: string }).code === 'string'
      ? (err as { code: string }).code
      : err instanceof Error
        ? err.message
        : '';
  if (code.includes('auth/email-already-in-use')) {
    return 'このメールアドレスは既に登録されています。ログインしてください。';
  }
  if (code.includes('auth/unauthorized-domain')) {
    return 'このドメインは Firebase の承認済みドメインに含まれていません。管理者に連絡するか、Firebase コンソールの「認証」→「設定」→「承認済みドメイン」にこのサイトのドメインを追加してください。';
  }
  if (code.includes('auth/invalid-api-key') || code.includes('auth/api-key-not-valid')) {
    return 'Firebase の設定が正しくありません。管理者に連絡してください。';
  }
  if (code.includes('auth/weak-password')) {
    return 'パスワードは6文字以上にしてください。';
  }
  if (code.includes('auth/invalid-email')) {
    return 'メールアドレスの形式が正しくありません。';
  }
  if (typeof code === 'string' && code.includes('auth/')) {
    return `入力内容を確認してください。（${code}）`;
  }
  return err instanceof Error ? err.message : '登録に失敗しました。';
}

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
      const auth = await getFirebaseAuthAsync();
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
      setError(getAuthErrorMessage(err));
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
