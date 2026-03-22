import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  asChild?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  asChild = false,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    minHeight: '44px', // タッチ操作に適した最小サイズ
    minWidth: '44px',
    fontSize: '1rem',
    fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s, background-color 0.2s',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-xs)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#fff',
    },
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      style: {
        ...(children as React.ReactElement).props.style,
        ...baseStyle,
        ...variantStyles[variant],
        opacity: disabled || loading ? 0.6 : 1,
        ...style,
      },
      disabled: disabled || loading,
    });
  }

  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    opacity: disabled || loading ? 0.6 : 1,
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={combinedStyle}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {loading && <span className="sr-only">読み込み中</span>}
      {children}
    </button>
  );
}
