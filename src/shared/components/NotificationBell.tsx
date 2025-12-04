// NotificationBell.tsx

import { twMerge } from "tailwind-merge";
import { IoNotificationsOutline } from "react-icons/io5";

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

const BASE_STYLES = {
  wrapper:
    "relative p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[var(--surface-dark)]/70 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all",
  icon: "h-6 w-6",
  badge:
    "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 whitespace-nowrap",
};

export const NotificationBell = ({
  count = 0,
  onClick,
  className = "",
}: NotificationBellProps) => {
  const displayCount = count > 99 ? "99+" : count > 0 ? String(count) : null;

  return (
    <button
      onClick={onClick}
      aria-label={`You have ${count} notifications`}
      type="button"
      className={twMerge(BASE_STYLES.wrapper, className)}
    >
      <IoNotificationsOutline className={BASE_STYLES.icon} />

      {displayCount && (
        <span aria-live="polite" className={BASE_STYLES.badge}>
          {displayCount}
        </span>
      )}
    </button>
  );
};
