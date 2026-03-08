'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? '作成に失敗しました');
        return;
      }
      router.push(`/dashboard/groups/${data.id}`);
      router.refresh();
    } catch (err) {
      setError('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>グループを作成</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 0.25 }}>
            グループ名
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: 0.5 }}
          />
        </div>
        {error && (
          <p style={{ color: 'var(--error, #c00)', marginBottom: '1rem' }}>{error}</p>
        )}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
          {loading ? '作成中...' : '作成'}
        </button>
        <Link href="/dashboard">キャンセル</Link>
      </form>
    </main>
  );
}
