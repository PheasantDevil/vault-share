import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // 現在のページ周辺
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // 最後のページ
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <span style={{ fontSize: '0.875rem', color: 'var(--muted, #666)', marginRight: '0.5rem' }}>
          {totalItems > 0
            ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} / ${totalItems}件`
            : '0件'}
        </span>
      )}
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
      >
        前へ
      </Button>
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} style={{ padding: '0 0.5rem' }}>
              ...
            </span>
          );
        }
        return (
          <Button
            key={page}
            variant={currentPage === page ? 'primary' : 'secondary'}
            onClick={() => onPageChange(page as number)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', minWidth: '2rem' }}
          >
            {page}
          </Button>
        );
      })}
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
      >
        次へ
      </Button>
    </div>
  );
}
