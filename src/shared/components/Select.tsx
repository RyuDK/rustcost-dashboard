import { useState } from "react";
import { twMerge } from "tailwind-merge";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  className?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
};

const BASE_SELECT_STYLES = {
  container: "relative inline-flex items-center",
  trigger:
    "inline-flex h-10 min-w-[6rem] items-center gap-2 pl-8 pr-3 text-sm font-semibold rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[var(--surface-dark)]/70 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
  panel:
    "absolute left-0 top-full mt-1 w-full min-w-[7rem] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[var(--surface-dark)]/70 shadow-lg z-50 overflow-hidden",
  option:
    "cursor-pointer px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
  iconWrapper: "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",
};

export default function Select({
  value,
  onChange,
  options,
  className,
  ariaLabel = "Select option",
  icon,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((opt) => opt.value === value) ?? options[0];

  const toggle = () => setIsOpen((prev) => !prev);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className={twMerge(BASE_SELECT_STYLES.container, className)}>
      {icon && <div className={BASE_SELECT_STYLES.iconWrapper}>{icon}</div>}

      <button
        type="button"
        aria-label={ariaLabel}
        onClick={toggle}
        className={BASE_SELECT_STYLES.trigger}
      >
        {selected.label}
      </button>

      {isOpen && (
        <div className={BASE_SELECT_STYLES.panel}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={BASE_SELECT_STYLES.option}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
