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
    const primaryButton = screen.getByText('Primary').closest('button');
    // CSS変数が解決されない場合、var(--primary) などの文字列が返される
    const primaryBg = primaryButton?.style.backgroundColor || '';
    expect(primaryBg).toMatch(/var\(--primary|rgb\(37,\s*99,\s*235\)|#2563eb/);

    rerender(<Button variant="secondary">Secondary</Button>);
    const secondaryButton = screen.getByText('Secondary').closest('button');
    const secondaryBg = secondaryButton?.style.backgroundColor || '';
    expect(secondaryBg).toMatch(/var\(--bg-primary|rgb\(255,\s*255,\s*255\)|#fff/);

    rerender(<Button variant="danger">Danger</Button>);
    const dangerButton = screen.getByText('Danger').closest('button');
    const dangerBg = dangerButton?.style.backgroundColor || '';
    expect(dangerBg).toMatch(/var\(--danger|rgb\(220,\s*38,\s*38\)|#dc2626/);
  });
});
