'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getFirebaseAuthAsync } from '@/lib/firebase/client';
import { multiFactor, getMultiFactorResolver } from 'firebase/auth';
import type { MultiFactorError } from 'firebase/auth';

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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
      setEnrolling(true);
      setError(null);
      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const mfa = multiFactor(user);
      const totpFactor = await mfa.getSession();
      const secret = await totpFactor.enroll({
        factorDisplayName: 'Authenticator App',
      });

      // QRコードを生成（実際の実装では、サーバー側でQRコードを生成する必要があります）
      // ここでは簡易的にsecretを表示
      setQrCode(secret.sharedSecretKey);
      setMfaType('totp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TOTP登録の開始に失敗しました');
      setEnrolling(false);
    }
  }

  async function startEnrollSms() {
    try {
      setEnrolling(true);
      setError(null);
      if (!phoneNumber.trim()) {
        setError('電話番号を入力してください');
        setEnrolling(false);
        return;
      }

      const auth = await getFirebaseAuthAsync();
      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です');
        setEnrolling(false);
        return;
      }

      const mfa = multiFactor(user);
      const phoneAuthCredential = await mfa.getSession();
      const phoneInfoOptions = {
        phoneNumber: phoneNumber.trim(),
        recaptchaVerifier: null, // 実際の実装ではreCAPTCHAが必要
      };

      // SMS MFAの登録は複雑なため、サーバー側APIで実装する必要があります
      setError('SMS MFAの登録は現在サポートされていません。TOTPをご利用ください。');
      setEnrolling(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMS登録の開始に失敗しました');
      setEnrolling(false);
    }
  }

  async function verifyEnrollment() {
    if (!mfaType || !verificationCode.trim()) {
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

      // 実際の検証処理はサーバー側APIで実装する必要があります
      // ここでは簡易的な実装
      setError('MFA検証はサーバー側APIで実装する必要があります');
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
      await mfa.unenroll({ uid: factorUid });
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

      {!enrolling && !mfaStatus?.enabled && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>MFAを有効化する:</p>
          <button type="button" onClick={startEnrollTotp} style={{ marginRight: '0.5rem' }}>
            TOTP（認証アプリ）で登録
          </button>
          <button type="button" onClick={startEnrollSms}>
            SMSで登録
          </button>
        </div>
      )}

      {enrolling && mfaType === 'totp' && (
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            QRコードをスキャンするか、以下のシークレットキーを認証アプリに入力してください:
          </p>
          {qrCode && (
            <div style={{ marginBottom: '0.5rem' }}>
              <code style={{ display: 'block', padding: '0.5rem', background: '#f5f5f5' }}>
                {qrCode}
              </code>
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
          <div>
            <button type="button" onClick={startEnrollSms} style={{ marginRight: '0.5rem' }}>
              送信
            </button>
            <button type="button" onClick={() => setEnrolling(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
