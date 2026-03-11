'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  PhoneMultiFactorGenerator,
  getMultiFactorResolver,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth';

type MFAStatus = {
  enabled: boolean;
  enrolledFactors: Array<{ uid: string; displayName?: string; factorId: string }>;
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [mfaType, setMfaType] = useState<'totp' | 'sms' | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  async function loadMFAStatus() {
    try {
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const mfa = multiFactor(user);
      const enrolledFactors = mfa.enrolledFactors;
      setMfaStatus({
        enabled: enrolledFactors.length > 0,
        enrolledFactors: enrolledFactors.map((f) => ({
          uid: f.uid,
          displayName: f.displayName ?? undefined,
          factorId: f.factorId,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA状態の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollTotp() {
    try {
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        setEnrolling(false);
        return;
      }

      const mfa = multiFactor(user);
      const session = await mfa.getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);

      // QRコードURLを生成（otpauth://形式）
      const email = user.email || 'user';
      const issuer = 'Vault Share';
      const qrCodeData = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${totpSecret.secretKey}&issuer=${encodeURIComponent(issuer)}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
      setQrCodeUrl(qrCodeUrl);

      // セッションとシークレットを一時的に保存（実際の実装では、より安全な方法を使用）
      (window as any).__mfaSession = session;
      (window as any).__totpSecret = totpSecret;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TOTP登録の開始に失敗しました');
      setEnrolling(false);
    }
  }

  async function startEnrollSms() {
    if (!phoneNumber.trim()) {
      setError('電話番号を入力してください');
      return;
    }

    // 電話番号の形式を検証（E.164形式を推奨）
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const normalizedPhone = phoneNumber.trim().replace(/[-\s]/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      setError('電話番号はE.164形式（例: +819012345678）で入力してください');
      return;
    }

    try {
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        setEnrolling(false);
        setMfaType(null);
        return;
      }

      // reCAPTCHAを初期化（まだ初期化されていない場合）
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
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

      const mfa = multiFactor(user);
      const session = await mfa.getSession();

      // PhoneAuthProviderを使用してSMSを送信
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const phoneAuthCredential = await phoneAuthProvider.verifyPhoneNumber(
        normalizedPhone,
        recaptchaVerifier
      );

      // 電話番号認証情報を一時的に保存
      (window as any).__phoneAuthCredential = phoneAuthCredential;
      setError('SMSが送信されました。コードを入力してください。');
    } catch (err) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code.includes('auth/invalid-phone-number')) {
        setError('無効な電話番号です。');
      } else if (code.includes('auth/quota-exceeded')) {
        setError('SMS送信の上限に達しました。1日10通まで無料です。TOTP認証をご利用ください。');
      } else if (code.includes('auth/captcha-check-failed')) {
        setError('reCAPTCHA認証に失敗しました。再度お試しください。');
      } else {
        setError(err instanceof Error ? err.message : 'SMS送信に失敗しました');
      }
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    }
  }

  async function verifySmsEnrollment() {
    if (!verificationCode.trim()) {
      setError('検証コードを入力してください');
      return;
    }

    try {
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const phoneAuthCredential = (window as any).__phoneAuthCredential;
      if (!phoneAuthCredential) {
        setError('電話番号認証情報が見つかりません。最初からやり直してください。');
        return;
      }

      const mfa = multiFactor(user);
      const session = await mfa.getSession();

      // PhoneAuthCredentialを作成
      const credential = PhoneAuthProvider.credential(phoneAuthCredential, verificationCode.trim());

      // PhoneMultiFactorGeneratorを使用してアサーションを作成
      const phoneAssertion = PhoneMultiFactorGenerator.assertionForEnrollment(credential);

      // MFAを登録
      await mfa.enroll(phoneAssertion, phoneNumber.trim());

      // クリーンアップ
      delete (window as any).__phoneAuthCredential;
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
      setPhoneNumber('');
      setVerificationCode('');
      setEnrolling(false);
      setMfaType(null);

      await loadMFAStatus();
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
      } else if (code.includes('auth/code-expired')) {
        setError('検証コードの有効期限が切れました。再度SMSを送信してください。');
      } else {
        setError(err instanceof Error ? err.message : '検証に失敗しました');
      }
    }
  }

  async function verifyEnrollment() {
    if (!verificationCode.trim()) {
      setError('検証コードを入力してください');
      return;
    }

    try {
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const session = (window as any).__mfaSession;
      const totpSecret = (window as any).__totpSecret;

      if (!session || !totpSecret) {
        setError('セッションが無効です。最初からやり直してください。');
        return;
      }

      const mfa = multiFactor(user);
      const totpCredential = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode.trim()
      );
      await mfa.enroll(totpCredential, 'Authenticator App');

      // クリーンアップ
      delete (window as any).__mfaSession;
      delete (window as any).__totpSecret;
      setQrCodeUrl(null);
      setVerificationCode('');
      setEnrolling(false);
      setMfaType(null);

      await loadMFAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '検証に失敗しました');
    }
  }

  async function unenrollMFA(factorUid: string) {
    if (!confirm('MFAを無効化しますか？')) return;

    try {
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const mfa = multiFactor(user);
      const enrolledFactors = mfa.enrolledFactors;
      const factor = enrolledFactors.find((f) => f.uid === factorUid);
      if (!factor) {
        setError('MFA要素が見つかりません');
        return;
      }

      await mfa.unenroll(factor);
      await loadMFAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFAの無効化に失敗しました');
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>設定</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard">← ダッシュボード</Link>
      </p>

      <h2 style={{ marginTop: '1.5rem', marginBottom: 0.5 }}>多要素認証（MFA）</h2>
      {error && <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>}

      {mfaStatus && (
        <div style={{ marginBottom: '1rem' }}>
          <p>
            MFA状態: <strong>{mfaStatus.enabled ? '有効' : '無効'}</strong>
          </p>
          {mfaStatus.enrolledFactors.length > 0 && (
            <div>
              <p>登録済みの認証方法:</p>
              <ul>
                {mfaStatus.enrolledFactors.map((factor) => (
                  <li key={factor.uid} style={{ marginBottom: '0.5rem' }}>
                    {factor.displayName || factor.factorId} ({factor.factorId})
                    <button
                      type="button"
                      onClick={() => unenrollMFA(factor.uid)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!mfaStatus?.enabled && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>MFAを有効化する:</p>
          <button
            type="button"
            onClick={() => {
              setMfaType('totp');
              setEnrolling(true);
              startEnrollTotp();
            }}
            style={{ marginRight: '0.5rem' }}
          >
            TOTP（認証アプリ）で登録
          </button>
          <button
            type="button"
            onClick={() => {
              setMfaType('sms');
              setEnrolling(true);
            }}
          >
            SMSで登録
          </button>
        </div>
      )}

      {enrolling && mfaType === 'totp' && (
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            QRコードをスキャンするか、以下のシークレットキーを認証アプリに入力してください:
          </p>
          {qrCodeUrl && (
            <div style={{ marginBottom: '0.5rem' }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '200px' }} />
            </div>
          )}
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              検証コード:
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6桁のコード"
                style={{ marginLeft: '0.25rem', padding: '0.25rem' }}
              />
            </label>
          </div>
          <div>
            <button type="button" onClick={verifyEnrollment} style={{ marginRight: '0.5rem' }}>
              検証
            </button>
            <button type="button" onClick={() => setEnrolling(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {enrolling && mfaType === 'sms' && (
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
          <p style={{ marginBottom: '0.5rem' }}>電話番号を入力してください:</p>
          <div id="recaptcha-container" style={{ marginBottom: '0.5rem' }}></div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              電話番号:
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+81-90-1234-5678"
                style={{ marginLeft: '0.25rem', padding: '0.25rem' }}
              />
            </label>
          </div>
          {error && error.includes('SMSが送信') && (
            <div style={{ marginBottom: '0.5rem' }}>
              <label>
                検証コード:
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6桁のコード"
                  style={{ marginLeft: '0.25rem', padding: '0.25rem' }}
                />
              </label>
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={error && error.includes('SMSが送信') ? verifySmsEnrollment : startEnrollSms}
              style={{ marginRight: '0.5rem' }}
            >
              {error && error.includes('SMSが送信') ? '検証' : '送信'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEnrolling(false);
                setMfaType(null);
                if (recaptchaVerifier) {
                  recaptchaVerifier.clear();
                  setRecaptchaVerifier(null);
                }
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
