import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { SkipLink } from '@/components/SkipLink';

export const metadata: Metadata = {
  title: 'Vault Share',
  description: '機密情報を親しい間柄で安全に共有',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <SkipLink href="#main-content" />
        <ToastProvider>
          <div id="main-content">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
