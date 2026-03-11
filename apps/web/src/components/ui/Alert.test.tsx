import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('should render alert with message', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should apply error type styles', () => {
    render(<Alert type="error">Error message</Alert>);
    const alert = screen.getByText('Error message');
    expect(alert).toHaveStyle({ backgroundColor: '#fee' });
  });

  it('should apply success type styles', () => {
    render(<Alert type="success">Success message</Alert>);
    const alert = screen.getByText('Success message');
    expect(alert).toHaveStyle({ backgroundColor: '#efe' });
  });

  it('should apply warning type styles', () => {
    render(<Alert type="warning">Warning message</Alert>);
    const alert = screen.getByText('Warning message');
    expect(alert).toHaveStyle({ backgroundColor: '#ffe' });
  });

  it('should apply info type styles', () => {
    render(<Alert type="info">Info message</Alert>);
    const alert = screen.getByText('Info message');
    expect(alert).toHaveStyle({ backgroundColor: '#eef' });
  });

  it('should have role="alert"', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
