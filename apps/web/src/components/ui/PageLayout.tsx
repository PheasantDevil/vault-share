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
      className="app-page"
      style={{ '--app-page-max-width': `${maxWidth}px` } as React.CSSProperties}
    >
      {backLink ? (
        <nav className="app-page__back" aria-label="パンくずナビゲーション">
          <a href={backLink.href}>
            <span aria-hidden="true">←</span>
            {backLink.label}
          </a>
        </nav>
      ) : null}
      <h1 className={`app-page__title${description ? '' : ' app-page__title--solo'}`}>{title}</h1>
      {description ? <p className="app-page__desc">{description}</p> : null}
      {children}
    </main>
  );
}
