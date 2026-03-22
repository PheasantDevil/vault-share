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
  RecaptchaVerifier,
} from 'firebase/auth';
import type { MultiFactorError, PhoneMultiFactorInfo } from 'firebase/auth';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

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
  const [smsSent, setSmsSent] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // URLパラメータからMFAエラーを取得
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // MFAエラーから電話番号を取得
    async function checkMfaType() {
      const mfaError = (window as any).__mfaError as MultiFactorError | undefined;
      if (mfaError) {
        try {
          const auth = await getFirebaseAuthAsync();
          const resolver = getMultiFactorResolver(auth, mfaError);
          const hint = resolver.hints[0];
          if (hint?.factorId === 'phone') {
            setMfaType('phone');
            const phoneHint = hint as PhoneMultiFactorInfo;
            setPhoneNumber(phoneHint.phoneNumber || null);
          }
        } catch (err) {
          console.error('Failed to check MFA type:', err);
        }
      }
    }

    checkMfaType();

    return () => {
      // クリーンアップ
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      let userCredential;

      if (resolver.hints[0].factorId === 'totp') {
        // TOTP認証
        const totpAssertion = TotpMultiFactorGenerator.assertionForSignIn(
          resolver.hints[0].uid,
          verificationCode.trim()
        );
        userCredential = await resolver.resolveSignIn(totpAssertion);
      } else if (resolver.hints[0].factorId === 'phone') {
        // Phone認証
        if (!smsSent) {
          // SMSをまだ送信していない場合は、SMS送信フローを開始
          const hint = resolver.hints[0];
          if (!hint || hint.factorId !== 'phone') {
            setError('電話番号が見つかりません');
            return;
          }
          const phoneHint = hint as PhoneMultiFactorInfo;
          if (!phoneHint.phoneNumber) {
            setError('電話番号が見つかりません');
            return;
          }

          // reCAPTCHAを初期化（DOM要素が必要なため、動的に作成）
          let verifier = recaptchaVerifier;
          if (!verifier) {
            // reCAPTCHAコンテナを作成
            const recaptchaContainer = document.createElement('div');
            recaptchaContainer.id = 'recaptcha-container-login';
            recaptchaContainer.style.display = 'none';
            document.body.appendChild(recaptchaContainer);

            verifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', {
              size: 'invisible',
              callback: () => {
                // reCAPTCHA認証成功時のコールバック
              },
              'expired-callback': () => {
                setError('reCAPTCHAの有効期限が切れました。再度お試しください。');
              },
            });
            setRecaptchaVerifier(verifier);
          }

          // SMSを送信
          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const phoneAuthCredential = await phoneAuthProvider.verifyPhoneNumber(
            phoneHint.phoneNumber,
            verifier
          );

          // 電話番号認証情報を一時的に保存
          (window as any).__phoneAuthCredential = phoneAuthCredential;
          setSmsSent(true);
          setError(null);
          // 成功メッセージは表示しない（UIで既に表示されている）
          return;
        } else {
          // SMSが既に送信されている場合は、コードを検証
          const phoneAuthCredential = (window as any).__phoneAuthCredential;
          if (!phoneAuthCredential) {
            setError('電話番号認証情報が見つかりません。最初からやり直してください。');
            return;
          }

          const credential = PhoneAuthProvider.credential(
            phoneAuthCredential,
            verificationCode.trim()
          );
          const phoneAssertion = PhoneMultiFactorGenerator.assertion(credential);
          userCredential = await resolver.resolveSignIn(phoneAssertion);

          // クリーンアップ
          delete (window as any).__phoneAuthCredential;
          if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            setRecaptchaVerifier(null);
          }
        }
      } else {
        setError('サポートされていないMFAタイプです');
        return;
      }
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
    <PageLayout
      title="多要素認証"
      description={
        mfaType === 'phone' && phoneNumber
          ? `登録済みの電話番号（${phoneNumber}）にSMSコードを送信しました。コードを入力してください。`
          : '認証コードを入力してください。'
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="認証コード"
          id="code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          required
          placeholder="6桁のコード"
          error={error && error.includes('コード') ? error : undefined}
        />
        {error && !error.includes('コード') && <Alert type="error">{error}</Alert>}
        <Button type="submit" loading={loading} variant="primary" style={{ width: '100%' }}>
          検証
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
