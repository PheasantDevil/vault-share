import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('should render pagination controls', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
        totalItems={100}
        itemsPerPage={20}
      />
    );

    expect(screen.getByText('前へ')).toBeInTheDocument();
    expect(screen.getByText('次へ')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should not render when totalPages is 1 or less', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChange}
        totalItems={10}
        itemsPerPage={20}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show correct item range', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
        totalItems={100}
        itemsPerPage={20}
      />
    );

    expect(screen.getByText(/21-40 \/ 100件/)).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
        totalItems={100}
        itemsPerPage={20}
      />
    );

    const prevButton = screen.getByText('前へ').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={onPageChange}
        totalItems={100}
        itemsPerPage={20}
      />
    );

    const nextButton = screen.getByText('次へ').closest('button');
    expect(nextButton).toBeDisabled();
  });
});
