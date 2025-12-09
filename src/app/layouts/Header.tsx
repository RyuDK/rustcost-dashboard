// Header.tsx
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useI18n } from "@/app/providers/i18n/useI18n";
import LangSelect from "@/app/layouts/components/LangSelect";
import { NotificationBell } from "@/shared/components/NotificationBell";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { setShowExplain } from "@/store/slices/preferenceSlice";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { language, setLanguage } = useI18n();
  const dispatch = useAppDispatch();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const explainLabel = showExplain ? "Hide Explain" : "Explain";

  return (
    <header
      className="
        flex items-center justify-between px-4 py-3 
        border-b border-[var(--border)]
        bg-[var(--surface)]/70 backdrop-blur
        dark:border-[var(--border)]
        dark:bg-[var(--surface-dark)]/40
        h-16
      "
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="
            p-2 rounded-md 
            hover:bg-[var(--overlay)] 
            dark:hover:bg-[var(--overlay)]
            transition
            flex items-center justify-center
          "
        >
          {/* Larger logo */}
          <img
            src="/logo-square.webp"
            alt="Logo"
            className="h-10 w-10 object-contain"
          />
        </button>

        <h1 className="text-xl font-semibold text-[var(--text)]">RustCost</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-pressed={showExplain}
          onClick={() => dispatch(setShowExplain(!showExplain))}
          className={`
            inline-flex h-10 items-center rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-500
            ${
              showExplain
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }
            dark:border-[var(--border)] dark:bg-[var(--surface-dark)]
            dark:hover:border-[var(--primary)] dark:hover:text-[var(--primary)]
          `}
        >
          {explainLabel}
        </button>
        <LangSelect value={language} onChange={setLanguage} />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
};
