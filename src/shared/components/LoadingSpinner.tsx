import { memo } from "react";
import { twMerge } from "tailwind-merge";

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
  color?: string;
  className?: string;
}

const BASE_LOADING_SPINNER_STYLES = {
  container:
    "flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-300",
  icon: "animate-spin",
  hiddenLabel: "sr-only",
};

const LoadingSpinnerComponent = ({
  label = "Loading",
  size = 28,
  color = "text-[var(--primary)]",
  className = "",
}: LoadingSpinnerProps) => {
  const mergedContainerClasses = twMerge(
    BASE_LOADING_SPINNER_STYLES.container,
    className
  );
  const mergedSvgClasses = twMerge(BASE_LOADING_SPINNER_STYLES.icon, color);

  return (
    <div role="status" aria-live="polite" className={mergedContainerClasses}>
      <svg
        className={mergedSvgClasses}
        width={size}
        height={size}
        viewBox="0 0 50 50"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset="60"
        />
      </svg>

      <span
        className={label ? undefined : BASE_LOADING_SPINNER_STYLES.hiddenLabel}
      >
        {label}
      </span>
    </div>
  );
};

export const LoadingSpinner = memo(LoadingSpinnerComponent);
