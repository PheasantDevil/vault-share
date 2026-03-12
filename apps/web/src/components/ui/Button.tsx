import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: React.ReactNode;
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
  const baseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    minHeight: '44px', // タッチ操作に適した最小サイズ
    minWidth: '44px',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: 'var(--border-radius, 4px)',
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
      backgroundColor: 'var(--primary, #0070f3)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--secondary, #f5f5f5)',
      color: 'var(--text-primary, #333)',
      border: '1px solid var(--border-color, #ddd)',
    },
    danger: {
      backgroundColor: 'var(--danger, #c00)',
      color: '#fff',
    },
  };

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

// CSS animation for spinner (should be added to global styles or styled-components)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.head.querySelector('style[data-spinner]')) {
    style.setAttribute('data-spinner', 'true');
    document.head.appendChild(style);
  }
}
