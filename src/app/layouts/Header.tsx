// Header.tsx
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useI18n } from "@/app/providers/i18n/useI18n";
import LangSelect from "@/app/layouts/components/LangSelect";
import { NotificationBell } from "@/shared/components/NotificationBell";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { language, setLanguage } = useI18n();

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
        <LangSelect value={language} onChange={setLanguage} />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
};
