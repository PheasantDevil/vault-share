'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { signInWithEmailAndPassword, getMultiFactorResolver } from 'firebase/auth';
import type { MultiFactorError } from 'firebase/auth';
import { getSafePostLoginPath } from '@/lib/auth/safe-post-login-path';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

function parseSessionApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'ログインに失敗しました。';
  const err = (data as { error?: unknown }).error;
  if (typeof err === 'string') return err;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: string }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return 'ログインに失敗しました。';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isGenericCredentialError = !!error && error.includes('メールアドレスまたはパスワード');

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
        setError(parseSessionApiError(data));
        return;
      }
      const from = new URLSearchParams(window.location.search).get('from');
      window.location.href = getSafePostLoginPath(from);
    } catch (err: unknown) {
      // MFAエラーの場合、MFAログインページにリダイレクト
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string' &&
        (err as { code: string }).code.includes('auth/multi-factor-auth-required')
      ) {
        // MFAエラーを一時的に保存
        (window as any).__mfaError = err;
        router.push('/login/mfa');
        return;
      }
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : '';
      const message =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message: string }).message === 'string'
          ? (err as { message: string }).message
          : err instanceof Error
            ? err.message
            : '';

      if (code.includes('auth/unauthorized-domain')) {
        setError(
          'このドメインは Firebase の承認済みドメインに含まれていません。管理者に連絡してください。'
        );
      } else if (
        code.includes('auth/invalid-api-key') ||
        code.includes('auth/api-key-not-valid') ||
        message.includes('Firebase API Key') ||
        message.includes('Firebase configuration is missing')
      ) {
        setError(
          'Firebase の設定が Cloud Run に反映されていません（NEXT_PUBLIC_FIREBASE_API_KEY が空の可能性）。管理者に連絡してください。'
        );
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
    <PageLayout
      title="ログイン"
      description="メール/パスワードでログイン（許可されたメールアドレスのみ）"
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="メールアドレス"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          error={
            error && !isGenericCredentialError && error.includes('メールアドレス')
              ? error
              : undefined
          }
        />
        <FormField
          label="パスワード"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          error={
            error && !isGenericCredentialError && error.includes('パスワード') ? error : undefined
          }
        />
        {error &&
          (isGenericCredentialError ||
            (!error.includes('メールアドレス') && !error.includes('パスワード'))) && (
            <Alert type="error">{error}</Alert>
          )}
        <Button type="submit" loading={loading} variant="primary" style={{ width: '100%' }}>
          ログイン
        </Button>
      </form>
      <div className="app-link-row">
        <Link href="/signup" className="app-link">
          新規登録
        </Link>
        <span className="app-link-row__sep" aria-hidden>
          |
        </span>
        <Link href="/reset-password" className="app-link">
          パスワードを忘れた場合
        </Link>
        <span className="app-link-row__sep" aria-hidden>
          |
        </span>
        <Link href="/" className="app-link">
          トップへ
        </Link>
      </div>
    </PageLayout>
  );
}
