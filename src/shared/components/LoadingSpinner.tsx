import { memo } from "react";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

const LoadingSpinnerComponent = ({
  label = "Loading",
  className = "",
}: LoadingSpinnerProps) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-300 ${className}`}
    role="status"
    aria-live="polite"
  >
    <svg
      className="h-6 w-6 animate-spin text-amber-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
      />
    </svg>
    <span>{label}…</span>
  </div>
);

export const LoadingSpinner = memo(LoadingSpinnerComponent);
