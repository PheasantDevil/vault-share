import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vault Share',
  description: '機密情報を親しい間柄で安全に共有',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
