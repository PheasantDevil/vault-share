'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { CsvImportGuidance } from '@/components/onepassword-import/CsvImportGuidance';
import { useOnePasswordConnectionStatus } from '@/lib/swr/hooks';

export default function OnePasswordImportMethodPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <OnePasswordImportMethodContent />
    </Suspense>
  );
}

function OnePasswordImportMethodContent() {
  const params = useParams();
  const router = useRouter();
  const groupId = typeof params.id === 'string' ? params.id : '';
  const { available, isLoading, isError, reason } = useOnePasswordConnectionStatus();

  const connectDisabled = isLoading || isError || available === false;

  return (
    <PageLayout
      title="1Passwordからインポート"
      description="インポート方法を選んでください"
      maxWidth={720}
      backLink={{ href: `/dashboard/groups/${groupId}`, label: 'グループ詳細' }}
    >
      {isError && (
        <Alert type="error">
          1Password Connect
          の利用可否を確認できませんでした。しばらくしてから再度お試しください。CSV
          からのインポートは引き続き利用できます。
        </Alert>
      )}

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          1Password Connect でインポート
        </h2>
        <p style={{ color: 'var(--muted, #666)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          サーバー側で 1Password Connect が設定されている環境では、Vault
          から直接アイテムを選んで取り込めます。
        </p>
        <Button
          type="button"
          variant="primary"
          disabled={connectDisabled}
          onClick={() => {
            router.push(`/dashboard/groups/${groupId}/1password`);
          }}
        >
          Connect で続行
        </Button>
        {isLoading && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted, #666)' }}>
            確認中…
          </p>
        )}
        {!isLoading && available === false && reason === 'not_configured' && (
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--muted, #666)',
              lineHeight: 1.5,
            }}
          >
            この環境では 1Password Connect
            が設定されていないため、この方法は利用できません。管理者が Connect
            を構成すると利用可能になります。別の方法として、下記の CSV インポートをご利用ください。
          </p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          CSV をエクスポートしてインポート
        </h2>
        <p style={{ color: 'var(--muted, #666)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          どの環境でも利用できます。1Password 公式の手順で CSV
          を出力し、このサービスに取り込みます。
        </p>
        <CsvImportGuidance groupId={groupId} showAdminHints />
      </section>

      <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
        <Link href={`/dashboard/groups/${groupId}`}>グループ詳細に戻る</Link>
      </p>
    </PageLayout>
  );
}
