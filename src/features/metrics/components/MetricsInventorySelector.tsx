import { useMemo } from "react";

type Key = string | number;

type MetricsInventorySelectorProps<T> = {
  label: string;
  placeholder?: string;

  items: T[];
  getKey: (item: T) => Key;
  getLabel: (item: T) => string;
  search: string;
  onSearchChange: (value: string) => void;
  onPickByLabel: (label: string) => void;
  onApply: () => void;
  helperText?: string;
  rightSlot?: React.ReactNode;
};

export function MetricsInventorySelector<T>({
  label,
  placeholder = "Type to search",
  items,
  getKey,
  getLabel,
  search,
  onSearchChange,
  onPickByLabel,
  onApply,
  helperText = "Showing up to 10 matches from runtime inventory.",
  rightSlot,
}: MetricsInventorySelectorProps<T>) {
  const datalistId = useMemo(
    () => `metrics-suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`,
    [label]
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[var(--surface-dark)]/40 md:p-6">
      <div className="flex w-full flex-col gap-1 md:w-80">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </label>

        <input
          type="search"
          list={datalistId}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onBlur={(e) => onPickByLabel(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
        />

        <datalist id={datalistId}>
          {items.map((item) => (
            <option key={String(getKey(item))} value={getLabel(item)} />
          ))}
        </datalist>

        <p className="text-[11px] text-gray-500">{helperText}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {rightSlot}

        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-[var(--border)] dark:bg-[var(--surface-dark)]"
          onClick={onApply}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
