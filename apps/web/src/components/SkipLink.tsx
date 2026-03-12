/**
 * スキップリンクコンポーネント（アクセシビリティ）
 */
import Link from 'next/link';

interface SkipLinkProps {
  href: string;
  label?: string;
}

export function SkipLink({ href, label = 'メインコンテンツへスキップ' }: SkipLinkProps) {
  return (
    <Link href={href} className="skip-link">
      {label}
    </Link>
  );
}
