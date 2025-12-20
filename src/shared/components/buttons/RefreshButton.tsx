import { twMerge } from "tailwind-merge";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { HiOutlineRefresh } from "react-icons/hi";

interface IProps {
  className?: string;
}

const BASE_REFRESH_BUTTON_STYLES = {
  button:
    "p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--surface-dark)]/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
  icon: "h-6 w-6",
};

export const RefreshButton = ({ className = "" }: IProps) => {
  const { t } = useI18n();

  const handleClick = () => {
    window.alert("This feature is planned but not implemented yet.");
  };

  return (
    <button
      onClick={handleClick}
      className={twMerge(BASE_REFRESH_BUTTON_STYLES.button, className)}
      aria-label={t("common.refresh")}
      type="button"
    >
      <HiOutlineRefresh className={BASE_REFRESH_BUTTON_STYLES.icon} />
    </button>
  );
};
