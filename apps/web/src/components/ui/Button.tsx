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
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: '4px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#0070f3',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#f5f5f5',
      color: '#333',
      border: '1px solid #ddd',
    },
    danger: {
      backgroundColor: 'var(--error, #c00)',
      color: '#fff',
    },
  };

  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    opacity: disabled || loading ? 0.6 : 1,
  };

  return (
    <button type="button" disabled={disabled || loading} style={combinedStyle} {...props}>
      {loading && (
        <span
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
