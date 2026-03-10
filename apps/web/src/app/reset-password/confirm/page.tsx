'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { confirmPasswordReset } from 'firebase/auth';

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError('無効なリセットリンクです。');
    } else {
      setOobCode(code);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      return;
    }

    if (!oobCode) {
      setError('無効なリセットリンクです。');
      return;
    }

    setLoading(true);
    try {
      const auth = await getFirebaseAuthAsync();
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code.includes('auth/expired-action-code')) {
        setError('リセットリンクの有効期限が切れています。再度パスワードリセットをリクエストしてください。');
      } else if (code.includes('auth/invalid-action-code')) {
        setError('無効なリセットリンクです。');
      } else if (code.includes('auth/weak-password')) {
        setError('パスワードが弱すぎます。より強いパスワードを設定してください。');
      } else {
        setError(err instanceof Error ? err.message : 'パスワードのリセットに失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem' }}>パスワードをリセットしました</h1>
        <p style={{ marginBottom: '1.5rem' }}>新しいパスワードが設定されました。ログインページにリダイレクトします...</p>
        <p>
          <Link href="/login">ログインページへ</Link>
        </p>
      </main>
    );
  }

  if (!oobCode) {
    return (
      <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem' }}>エラー</h1>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <p>
          <Link href="/reset-password">パスワードリセットページへ戻る</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>新しいパスワードを設定</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        新しいパスワードを入力してください。
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 0.25 }}>
            新しいパスワード
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
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 0.25 }}>
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? '設定中...' : 'パスワードを設定'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/login">ログインページへ戻る</Link>
      </p>
    </main>
  );
}
