import { useTheme } from "@/app/providers/ThemeProvider";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      aria-label="Toggle dark mode"
      type="button"
    >
      {isDark ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
    </button>
  );
};
