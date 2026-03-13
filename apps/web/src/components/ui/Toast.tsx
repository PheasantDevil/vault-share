'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, message, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }: { toast: Toast; removeToast: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // アニメーション用の遅延
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const typeStyles: Record<ToastType, React.CSSProperties> = {
    success: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      color: '#155724',
    },
    error: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      color: '#721c24',
    },
    warning: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffeaa7',
      color: '#856404',
    },
    info: {
      backgroundColor: '#d1ecf1',
      borderColor: '#bee5eb',
      color: '#0c5460',
    },
  };

  return (
    <div
      style={{
        ...typeStyles[toast.type],
        padding: '0.75rem 1rem',
        borderRadius: '4px',
        border: '1px solid',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        minWidth: '200px',
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          fontSize: '1.25rem',
          lineHeight: 1,
          color: 'inherit',
          opacity: 0.7,
        }}
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}
