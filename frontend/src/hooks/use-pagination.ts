import { useMemo, useState } from "react";

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  pageItems: T[];
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  next: () => void;
  prev: () => void;
}

/**
 * Client-side pagination over an in-memory list.
 * Automatically clamps the current page when the list shrinks (e.g. after filtering).
 */
export function usePagination<T>(items: T[], initialPageSize = 10): UsePaginationResult<T> {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, total);

  const setPage = (p: number) => setPageState(Math.min(Math.max(1, p), totalPages));
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPageState(1);
  };

  return {
    page: safePage,
    pageSize,
    totalPages,
    total,
    pageItems,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    next: () => setPage(safePage + 1),
    prev: () => setPage(safePage - 1),
  };
}
