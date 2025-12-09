import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Popup from "reactjs-popup";
import type { PopupActions } from "reactjs-popup/dist/types";

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
  container: "relative inline-flex items-center h-10",
  trigger:
    "inline-flex h-10 items-center gap-2 pl-8 pr-3 text-sm font-semibold rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[var(--surface-dark)]/70 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
  panel:
    "mt-2 w-full min-w-[7rem] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-[70] overflow-hidden",
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
  const selected = options.find((opt) => opt.value === value) ?? options[0];
  const popupRef = useRef<PopupActions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popup
      ref={popupRef}
      position="bottom left"
      arrow={false}
      closeOnDocumentClick
      offsetY={4}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      overlayStyle={{ background: "transparent", zIndex: 60 }}
      contentStyle={{
        padding: 0,
        border: "none",
        background: "transparent",
        zIndex: 70,
        boxShadow: "none",
      }}
      trigger={
        <div className={twMerge(BASE_SELECT_STYLES.container, className)}>
          {icon && <div className={BASE_SELECT_STYLES.iconWrapper}>{icon}</div>}

          <button
            type="button"
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={BASE_SELECT_STYLES.trigger}
          >
            {selected.label}
          </button>
        </div>
      }
    >
      <div className={BASE_SELECT_STYLES.panel} role="listbox">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={twMerge(
              BASE_SELECT_STYLES.option,
              opt.value === selected.value ? "bg-gray-100 dark:bg-gray-700" : ""
            )}
            onClick={() => {
              onChange?.(opt.value);
              popupRef.current?.close();
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Popup>
  );
}
