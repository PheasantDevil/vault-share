'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

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
    <PageLayout
      title="新規登録"
      description="メール/パスワードで登録（許可されたメールアドレスのみ）"
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
            error && (error.includes('メールアドレス') || error.includes('email'))
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
          autoComplete="new-password"
          minLength={6}
          helperText="6文字以上"
          error={error && error.includes('パスワード') ? error : undefined}
        />
        <FormField
          label="表示名"
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          helperText="任意"
        />
        {error &&
          !error.includes('メールアドレス') &&
          !error.includes('パスワード') &&
          !error.includes('email') && <Alert type="error">{error}</Alert>}
        <Button type="submit" loading={loading} variant="primary" style={{ width: '100%' }}>
          登録
        </Button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link
          href="/login"
          style={{ color: 'var(--link, #0070f3)', textDecoration: 'none', marginRight: '0.5rem' }}
        >
          ログイン
        </Link>
        <span style={{ color: 'var(--muted, #999)' }}>|</span>
        <Link
          href="/"
          style={{ color: 'var(--link, #0070f3)', textDecoration: 'none', marginLeft: '0.5rem' }}
        >
          トップへ
        </Link>
      </p>
    </PageLayout>
  );
}
