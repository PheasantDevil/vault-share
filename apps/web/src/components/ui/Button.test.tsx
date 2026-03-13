import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me').closest('button')).toBeDisabled();
  });

  it('should be disabled when loading prop is true', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText('Click me').closest('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary').closest('button')).toHaveStyle({
      backgroundColor: '#0070f3',
    });

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary').closest('button')).toHaveStyle({
      backgroundColor: '#f5f5f5',
    });

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger').closest('button')).toHaveStyle({
      backgroundColor: 'var(--error, #c00)',
    });
  });
});
