import React from 'react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Alert({ type = 'error', children, style }: AlertProps) {
  const typeStyles: Record<string, React.CSSProperties> = {
    error: {
      backgroundColor: 'var(--alert-error-bg)',
      borderColor: 'var(--alert-error-border)',
      color: 'var(--alert-error-fg)',
    },
    success: {
      backgroundColor: 'var(--alert-success-bg)',
      borderColor: 'var(--alert-success-border)',
      color: 'var(--alert-success-fg)',
    },
    warning: {
      backgroundColor: 'var(--alert-warning-bg)',
      borderColor: 'var(--alert-warning-border)',
      color: 'var(--alert-warning-fg)',
    },
    info: {
      backgroundColor: 'var(--alert-info-bg)',
      borderColor: 'var(--alert-info-border)',
      color: 'var(--alert-info-fg)',
    },
  };

  return (
    <div
      role="alert"
      style={{
        padding: '0.75rem 1rem',
        marginBottom: 'var(--spacing-md)',
        border: '1px solid',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 1.5,
        ...typeStyles[type],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
