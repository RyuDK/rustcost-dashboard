import { twMerge } from "tailwind-merge";

const BASE_ERROR_BOUNDARY_STYLES = {
  fallback:
    "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200",
};

export function DefaultFallback({ className }: { className?: string }) {
  return (
    <div className={twMerge(BASE_ERROR_BOUNDARY_STYLES.fallback, className)}>
      Something went wrong. Please try again.
    </div>
  );
}
