'use client';

import Link from 'next/link';
import {
  ONEPASSWORD_CONNECT_DOCS_URL,
  ONEPASSWORD_EXPORT_HELP_URL,
  ONEPASSWORD_SHARE_VAULT_HELP_URL,
} from '@/lib/1password/external-links';

type Props = {
  groupId: string;
  /** 管理者向けの Connect 参考リンクを表示するか */
  showAdminHints?: boolean;
};

/**
 * 1Password から CSV をエクスポートし、当サービスでインポートする手順の誘導
 */
export function CsvImportGuidance({ groupId, showAdminHints = false }: Props) {
  const groupHref = `/dashboard/groups/${groupId}#csv-import`;

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--border-color, #ddd)',
        borderRadius: 'var(--radius-md, 8px)',
        backgroundColor: 'var(--bg-secondary, #f9f9f9)',
      }}
    >
      <p style={{ marginTop: 0, marginBottom: '0.75rem', lineHeight: 1.6 }}>
        1Password アプリで Vault からデータを <strong>CSV 形式でエクスポート</strong>
        し、そのファイルをこのサービスにアップロードしてインポートします。エクスポートした CSV は
        <strong>暗号化されていない</strong>ため、取り扱いに注意してください。
      </p>
      <ul style={{ margin: '0 0 0.75rem 1.25rem', padding: 0, lineHeight: 1.6 }}>
        <li>
          <a href={ONEPASSWORD_EXPORT_HELP_URL} target="_blank" rel="noopener noreferrer">
            1Password 公式: データのエクスポート方法
          </a>
        </li>
        <li>
          <Link href={groupHref}>このグループの「CSVからインポート」へ移動</Link>
        </li>
      </ul>
      {showAdminHints && (
        <p
          style={{
            marginBottom: 0,
            fontSize: '0.875rem',
            color: 'var(--muted, #666)',
            lineHeight: 1.5,
          }}
        >
          管理者向け: 1Password Connect の利用は{' '}
          <a href={ONEPASSWORD_CONNECT_DOCS_URL} target="_blank" rel="noopener noreferrer">
            Connect ドキュメント
          </a>
          、共有 Vault の作成は{' '}
          <a href={ONEPASSWORD_SHARE_VAULT_HELP_URL} target="_blank" rel="noopener noreferrer">
            公式ヘルプ
          </a>
          を参照してください。
        </p>
      )}
    </div>
  );
}
