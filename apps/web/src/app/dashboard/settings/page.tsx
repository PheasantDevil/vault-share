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

      {!mfaStatus?.enabled && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            MFAを有効化するには、Identity PlatformのコンソールでMFAを有効化する必要があります。
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            現在、MFAの登録機能は実装中です。Identity PlatformのコンソールでMFAを有効化した後、このページからMFAを設定できるようになります。
          </p>
        </div>
      )}
    </main>
  );
}
