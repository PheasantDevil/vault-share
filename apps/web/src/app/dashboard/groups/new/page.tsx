'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

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
    <PageLayout
      title="グループを作成"
      description="新しいグループを作成して、機密情報を共有しましょう"
      maxWidth={400}
      backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="グループ名"
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={error}
        />
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button type="submit" loading={loading} variant="primary">
            作成
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')}>
            キャンセル
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
