import { twMerge } from "tailwind-merge";
import { useTheme } from "@/app/providers/themeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/app/providers/i18n/useI18n";

interface ThemeToggleProps {
  className?: string;
}

const BASE_THEME_TOGGLE_STYLES = {
  button:
    "p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--surface-dark)]/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
  icon: "h-6 w-6",
};

export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={twMerge(BASE_THEME_TOGGLE_STYLES.button, className)}
      aria-label={t("theme.toggleAriaLabel")}
      aria-pressed={isDark}
      type="button"
    >
      {isDark ? (
        <MoonIcon className={BASE_THEME_TOGGLE_STYLES.icon} />
      ) : (
        <SunIcon className={BASE_THEME_TOGGLE_STYLES.icon} />
      )}
    </button>
  );
};
