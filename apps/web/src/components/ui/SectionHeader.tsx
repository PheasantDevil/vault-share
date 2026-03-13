import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            marginBottom: description ? '0.25rem' : 0,
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              margin: 0,
              color: 'var(--muted, #666)',
              fontSize: '0.875rem',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>
      )}
    </div>
  );
}
