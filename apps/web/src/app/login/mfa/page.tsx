'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import {
  getMultiFactorResolver,
  PhoneAuthProvider,
  TotpMultiFactorGenerator,
  PhoneMultiFactorGenerator,
} from 'firebase/auth';
import type { MultiFactorError } from 'firebase/auth';

export default function MFALoginPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <MFALoginContent />
    </Suspense>
  );
}

function MFALoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaType, setMfaType] = useState<'totp' | 'phone' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    // URLパラメータからMFAエラーを取得
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('検証コードを入力してください');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const auth = await getFirebaseAuthAsync();
      const error = (window as any).__mfaError as MultiFactorError;
      if (!error) {
        setError('MFAエラーが見つかりません。ログインページから再度ログインしてください。');
        return;
      }

      const resolver = getMultiFactorResolver(auth, error);
      let credential;

      if (resolver.hints[0].factorId === 'totp') {
        // TOTP認証
        const totpAssertion = TotpMultiFactorGenerator.assertionForSignIn(
          resolver.hints[0].uid,
          verificationCode.trim()
        );
        credential = resolver.resolver.signInWithTotp(totpAssertion);
      } else if (resolver.hints[0].factorId === 'phone') {
        // Phone認証
        const phoneCredential = PhoneAuthProvider.credential(
          resolver.hints[0].verificationId,
          verificationCode.trim()
        );
        credential = resolver.resolver.signInWithPhoneCredential(phoneCredential);
      } else {
        setError('サポートされていないMFAタイプです');
        return;
      }

      const userCredential = await credential;
      const idToken = await userCredential.user.getIdToken();

      // セッション発行APIを呼び出し
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

      // クリーンアップ
      delete (window as any).__mfaError;
      window.location.href = '/dashboard';
    } catch (err) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code.includes('auth/invalid-verification-code')) {
        setError('検証コードが正しくありません。');
      } else {
        setError(err instanceof Error ? err.message : 'MFA検証に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>多要素認証</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        認証コードを入力してください。
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="code" style={{ display: 'block', marginBottom: 0.25 }}>
            認証コード
          </label>
          <input
            id="code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            placeholder="6桁のコード"
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? '検証中...' : '検証'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/login">ログインページへ戻る</Link>
      </p>
    </main>
  );
}
