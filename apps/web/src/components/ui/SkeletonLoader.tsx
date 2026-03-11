import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
  height?: string;
  width?: string;
  style?: React.CSSProperties;
}

export function SkeletonLoader({ rows = 1, height = '1rem', width = '100%', style }: SkeletonLoaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            width: i === rows - 1 && rows > 1 ? '80%' : width,
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

// CSS animation for pulse (should be added to global styles)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  if (!document.head.querySelector('style[data-skeleton]')) {
    style.setAttribute('data-skeleton', 'true');
    document.head.appendChild(style);
  }
}
