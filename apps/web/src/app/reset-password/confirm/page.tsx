'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { confirmPasswordReset } from 'firebase/auth';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

function ResetPasswordConfirmContent() {
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
        setError(
          'リセットリンクの有効期限が切れています。再度パスワードリセットをリクエストしてください。'
        );
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
      <PageLayout title="パスワードをリセットしました">
        <Alert type="success">
          新しいパスワードが設定されました。ログインページにリダイレクトします...
        </Alert>
        <div className="app-link-row">
          <Link href="/login" className="app-link">
            ログインページへ
          </Link>
        </div>
      </PageLayout>
    );
  }

  if (!oobCode) {
    return (
      <PageLayout title="エラー">
        {error && <Alert type="error">{error}</Alert>}
        <div className="app-link-row">
          <Link href="/reset-password" className="app-link">
            パスワードリセットページへ戻る
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="新しいパスワードを設定" description="新しいパスワードを入力してください。">
      <form onSubmit={handleSubmit}>
        <FormField
          label="新しいパスワード"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
          helperText="6文字以上"
          error={
            error && (error.includes('パスワード') || error.includes('弱すぎ')) ? error : undefined
          }
        />
        <FormField
          label="パスワード（確認）"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
          error={error && error.includes('一致しません') ? error : undefined}
        />
        {error &&
          !error.includes('パスワード') &&
          !error.includes('一致しません') &&
          !error.includes('弱すぎ') && <Alert type="error">{error}</Alert>}
        <Button type="submit" loading={loading} variant="primary" style={{ width: '100%' }}>
          パスワードを設定
        </Button>
      </form>
      <div className="app-link-row">
        <Link href="/login" className="app-link">
          ログインページへ戻る
        </Link>
      </div>
    </PageLayout>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
