// Header.tsx
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useI18n } from "@/app/providers/i18n/useI18n";
import type { LanguageCode } from "@/types/i18n";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { language, setLanguage, languageOptions } = useI18n();

  return (
    <header
      className="
        flex items-center justify-between px-4 py-3 
        border-b border-[var(--border)]
        bg-[var(--surface)]/70 backdrop-blur
        dark:border-[var(--border)]
        dark:bg-[var(--surface)]/70
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
          "
        >
          <img src="/logo-square.webp" alt="Logo" className="h-6 w-6" />
        </button>

        {/* 여기 dark:text 변수 오타 있어서 같이 고쳤어 (var(-text) -> var(--text)) */}
        <h1 className="text-lg font-semibold text-[var(--text)] dark:text-[var(--text)]">
          RustCost
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="
            rounded-md border border-[var(--border)] 
            bg-[var(--surface)]
            px-2 py-1 text-sm shadow-sm
            focus:border-[var(--primary)]
            focus:ring-[var(--primary)]

            dark:border-[var(--border)]
            dark:bg-[var(--surface)]
          "
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>

        <ThemeToggle />
      </div>
    </header>
  );
};
