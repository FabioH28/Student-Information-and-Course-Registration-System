import { ChevronLeft, ChevronRight } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";

import { Button } from "@/components/ui/button";

interface DataPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

/**
 * Reusable pagination footer for admin tables. Renders a range summary,
 * page-size selector, and prev/next + numbered page controls.
 */
export function DataPagination({
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "items",
}: DataPaginationProps) {
  if (total === 0) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          {startIndex}–{endIndex} of {total} {itemLabel}
        </span>
        <NativeSelect
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 w-auto px-2 text-xs"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="icon"
              variant={p === page ? "default" : "outline"}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          size="icon"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** Build a compact page list with ellipses, e.g. [1, "...", 4, 5, 6, "...", 20]. */
function getPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}
