import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  maxWidth?: number;
  children: React.ReactNode;
  backLink?: { href: string; label: string };
}

export function PageLayout({
  title,
  description,
  maxWidth = 400,
  children,
  backLink,
}: PageLayoutProps) {
  return (
    <main
      style={{
        padding: 'clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2rem)',
        maxWidth: `${maxWidth}px`,
        margin: '0 auto',
        minHeight: 'calc(100vh - 4rem)',
        width: '100%',
      }}
    >
      {backLink && (
        <nav aria-label="パンくずナビゲーション" style={{ marginBottom: '1rem' }}>
          <a
            href={backLink.href}
            style={{
              color: 'var(--link, #0070f3)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span aria-hidden="true">←</span>
            {backLink.label}
          </a>
        </nav>
      )}
      <h1
        style={{
          marginBottom: description ? '0.5rem' : '1.5rem',
          fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {description && (
        <p
          style={{
            color: 'var(--muted, #666)',
            marginBottom: '1.5rem',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}
      {children}
    </main>
  );
}
