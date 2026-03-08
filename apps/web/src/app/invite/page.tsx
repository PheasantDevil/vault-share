'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
      <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <h1>招待</h1>
        <p>招待リンクが正しくありません。</p>
        <Link href="/">トップへ</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1>招待</h1>
      <p style={{ marginBottom: '1rem' }}>
        この招待リンクでグループに参加します。ログインしている必要があります。
      </p>
      {result === 'success' && (
        <p style={{ color: 'green', marginBottom: '1rem' }}>{message}</p>
      )}
      {result === 'error' && (
        <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{message}</p>
      )}
      <button type="button" onClick={handleAccept} disabled={loading} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
        {loading ? '参加中...' : '参加する'}
      </button>
      <Link href="/login">ログイン</Link>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/">トップへ</Link>
        <Link href="/dashboard" style={{ marginLeft: '1rem' }}>ダッシュボード</Link>
      </p>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <h1>招待</h1>
        <p>読み込み中...</p>
      </main>
    }>
      <InviteContent />
    </Suspense>
  );
}
