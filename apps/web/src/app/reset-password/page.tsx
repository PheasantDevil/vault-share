'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

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
      const message =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message: string }).message === 'string'
          ? (err as { message: string }).message
          : '';

      if (code.includes('auth/user-not-found')) {
        // セキュリティ上の理由で、ユーザーが存在しない場合でも成功を表示
        setSent(true);
      } else if (code.includes('auth/invalid-email')) {
        setError('メールアドレスの形式が正しくありません。');
      } else if (
        code.includes('auth/invalid-api-key') ||
        code.includes('auth/api-key-not-valid') ||
        message.includes('Firebase API Key')
      ) {
        setError('Firebase の設定が正しくありません。管理者に連絡してください。');
      } else {
        setError(
          err instanceof Error ? err.message : 'パスワードリセットメールの送信に失敗しました。'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <PageLayout title="メールを送信しました">
        <Alert type="success">
          パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。
        </Alert>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ color: 'var(--link, #0070f3)', textDecoration: 'none' }}>
            ログインページへ戻る
          </Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="パスワードリセット"
      description="メールアドレスを入力してください。パスワードリセット用のリンクを送信します。"
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
          error={error ?? undefined}
        />
        {error && <Alert type="error">{error}</Alert>}
        <Button type="submit" loading={loading} variant="primary" style={{ width: '100%' }}>
          送信
        </Button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link href="/login" style={{ color: 'var(--link, #0070f3)', textDecoration: 'none' }}>
          ログインページへ戻る
        </Link>
      </p>
    </PageLayout>
  );
}
