'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) setResult('error');
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setLoading(true);
    setResult('idle');
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult('error');
        setMessage(data.error ?? '参加に失敗しました');
        return;
      }
      setResult('success');
      setMessage(data.groupId ? 'グループに参加しました。' : (data.message ?? '参加しました。'));
      if (data.groupId) {
        setTimeout(() => {
          window.location.href = `/dashboard/groups/${data.groupId}`;
        }, 1500);
      }
    } catch {
      setResult('error');
      setMessage('参加に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <PageLayout title="招待" maxWidth={400}>
        <Alert type="error">招待リンクが正しくありません。</Alert>
        <div className="app-link-row" style={{ marginTop: 'var(--spacing-md)' }}>
          <Link href="/" className="app-link">
            トップへ
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="招待"
      description="この招待リンクでグループに参加します。ログインしている必要があります。"
      maxWidth={400}
    >
      {result === 'success' ? <Alert type="success">{message}</Alert> : null}
      {result === 'error' && message ? <Alert type="error">{message}</Alert> : null}
      <div className="app-toolbar">
        <Button type="button" variant="primary" onClick={handleAccept} loading={loading}>
          {loading ? '参加中...' : '参加する'}
        </Button>
        <Link href="/login" className="app-link">
          ログイン
        </Link>
      </div>
      <div className="app-link-row">
        <Link href="/" className="app-link">
          トップへ
        </Link>
        <span className="app-link-row__sep" aria-hidden>
          |
        </span>
        <Link href="/dashboard" className="app-link">
          ダッシュボード
        </Link>
      </div>
    </PageLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <PageLayout title="招待" description="読み込み中…" maxWidth={400}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            しばらくお待ちください。
          </p>
        </PageLayout>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
