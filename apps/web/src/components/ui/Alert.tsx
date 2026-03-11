import React from 'react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Alert({ type = 'error', children, style }: AlertProps) {
  const typeStyles: Record<string, React.CSSProperties> = {
    error: {
      backgroundColor: '#fee',
      borderColor: 'var(--error, #c00)',
      color: 'var(--error, #c00)',
    },
    success: {
      backgroundColor: '#efe',
      borderColor: '#0a0',
      color: '#0a0',
    },
    warning: {
      backgroundColor: '#ffe',
      borderColor: '#fa0',
      color: '#fa0',
    },
    info: {
      backgroundColor: '#eef',
      borderColor: '#07f',
      color: '#07f',
    },
  };

  return (
    <div
      role="alert"
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        border: '1px solid',
        borderRadius: '4px',
        fontSize: '0.875rem',
        ...typeStyles[type],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
