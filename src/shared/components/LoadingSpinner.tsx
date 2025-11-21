import { memo } from "react";
import { twMerge } from "tailwind-merge";

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
  color?: string;
  className?: string;
}

const LoadingSpinnerComponent = ({
  label = "Loading…",
  size = 28,
  color = "text-amber-500",
  className = "",
}: LoadingSpinnerProps) => {
  const mergedContainerClasses = twMerge(
    "flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-300",
    className
  );

  const mergedSvgClasses = twMerge("animate-spin", color);

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

      <span className={!label ? "sr-only" : undefined}>{label}</span>
    </div>
  );
};

export const LoadingSpinner = memo(LoadingSpinnerComponent);
