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
        padding: '2rem 1rem',
        maxWidth: `${maxWidth}px`,
        margin: '0 auto',
        minHeight: 'calc(100vh - 4rem)',
      }}
    >
      {backLink && (
        <p style={{ marginBottom: '1rem' }}>
          <a
            href={backLink.href}
            style={{
              color: 'var(--link, #0070f3)',
              textDecoration: 'none',
            }}
          >
            ← {backLink.label}
          </a>
        </p>
      )}
      <h1
        style={{
          marginBottom: description ? '0.5rem' : '1.5rem',
          fontSize: '1.875rem',
          fontWeight: 600,
        }}
      >
        {title}
      </h1>
      {description && (
        <p
          style={{
            color: 'var(--muted, #666)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
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
