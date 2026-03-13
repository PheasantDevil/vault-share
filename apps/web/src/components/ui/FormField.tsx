import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}

export function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
  minLength,
  maxLength,
  error,
  helperText,
  disabled = false,
  rows,
  style,
}: FormFieldProps) {
  const inputId = `field-${id}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div style={{ marginBottom: '1rem', ...style }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          marginBottom: '0.25rem',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--error, #c00)', marginLeft: '0.25rem' }}>*</span>}
      </label>
      {rows ? (
        <textarea
          id={inputId}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperId}
          aria-required={required}
          style={{
            width: '100%',
            padding: 'clamp(0.5rem, 2vw, 0.75rem)',
            fontSize: 'var(--font-size-base, 1rem)',
            border: `1px solid ${error ? 'var(--error, #c00)' : 'var(--border-color, #ddd)'}`,
            borderRadius: 'var(--border-radius, 4px)',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: '44px', // タッチ操作に適した最小サイズ
          }}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperId}
          aria-required={required}
          style={{
            width: '100%',
            padding: 'clamp(0.5rem, 2vw, 0.75rem)',
            fontSize: 'var(--font-size-base, 1rem)',
            border: `1px solid ${error ? 'var(--error, #c00)' : 'var(--border-color, #ddd)'}`,
            borderRadius: 'var(--border-radius, 4px)',
            fontFamily: 'inherit',
            minHeight: '44px', // タッチ操作に適した最小サイズ
          }}
        />
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            color: 'var(--error, #c00)',
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={helperId}
          style={{
            color: 'var(--muted, #666)',
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
