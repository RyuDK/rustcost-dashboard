import { NavLink, Outlet } from "react-router-dom";
import { ThemeToggle } from "../../shared/components/ThemeToggle";
import { useI18n } from "../providers/I18nProvider";
import { SUPPORTED_LANGUAGES } from "../../i18n/i18n";
import { useTheme } from "../providers/ThemeProvider";

const navItems = [
  { to: "/", translationKey: "nav.dashboard" },
  { to: "/trends", translationKey: "nav.trends" },
  { to: "/efficiency", translationKey: "nav.efficiency" },
  { to: "/settings", translationKey: "nav.settings" },
];

export const RootLayout = () => {
  const { t, language, setLanguage } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo.webp"
              alt="RustCost"
              className="h-10 w-10 rounded-md border border-amber-500/40 p-1"
            />
            <div>
              <h1 className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                RustCost Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("dashboard.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as (typeof SUPPORTED_LANGUAGES)[number])
              }
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
            <ThemeToggle />
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-6 pb-4">
          <ul className="flex gap-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            {navItems.map(({ to, translationKey }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [
                      "rounded-md px-3 py-2 transition-colors",
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                        : "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:bg-amber-400/10 dark:hover:text-amber-200",
                    ].join(" ")
                  }
                  end={to === "/"}
                >
                  {t(translationKey as never)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white/60 px-6 py-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>&copy; {new Date().getFullYear()} RustCost</span>
          <span className="text-xs uppercase tracking-wide">
            Theme: {theme}
          </span>
        </div>
      </footer>
    </div>
  );
};
