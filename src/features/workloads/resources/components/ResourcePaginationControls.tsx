import { PAGE_SIZE_OPTIONS } from "../hooks/usePaginatedResource";

type PaginationProps = {
  offset: number;
  pageSize: number;
  totalCount: number;
  isLoading: boolean;
  setOffset: (value: number | ((prev: number) => number)) => void;
  setPageSize: (value: number | ((prev: number) => number)) => void;
  pageSizeOptions?: number[];
};

export const ResourcePaginationControls = ({
  offset,
  pageSize,
  totalCount,
  isLoading,
  setOffset,
  setPageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: PaginationProps) => {
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(totalCount, 1) / pageSize)
  );

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOffset((prev) => Math.max(prev - pageSize, 0))}
        disabled={offset === 0 || isLoading}
        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
      >
        Prev
      </button>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() =>
          setOffset((prev) =>
            prev + pageSize < totalCount ? prev + pageSize : prev
          )
        }
        disabled={offset + pageSize >= totalCount || isLoading}
        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
      >
        Next
      </button>
      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
        Page size
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          value={pageSize}
          onChange={(event) => {
            const nextSize = Number(event.target.value);
            setPageSize(nextSize);
            setOffset(0);
          }}
          disabled={isLoading}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
