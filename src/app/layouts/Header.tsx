// Header.tsx
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useI18n } from "@/app/providers/i18n/useI18n";
import LangSelect from "@/app/layouts/components/LangSelect";
import { NotificationBell } from "@/shared/components/NotificationBell";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { setShowExplain } from "@/store/slices/preferenceSlice";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const dispatch = useAppDispatch();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const explainLabel = showExplain
    ? t("header.explain.hide")
    : t("header.explain.show");

  return (
    <header
      className="
        flex items-center justify-between px-4 py-3 
        border-b border-(--border)
        bg-(--surface)/70 backdrop-blur
        dark:border-(--border)
        dark:bg-(--surface-dark)/40
        h-16
      "
    >
      <button
        onClick={() => navigate("/")}
        className="
            p-2 rounded-md 
            hover:bg-(--overlay) 
            dark:hover:bg-(--overlay)
            transition
            flex items-center justify-center
          "
      >
        <img
          src="/logo-square.webp"
          alt={t("header.logoAlt")}
          className="h-10 w-10 object-contain"
        />
        <h1 className="text-xl font-semibold text-(--text)">
          {t("common.brandName")}
        </h1>
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-pressed={showExplain}
          onClick={() => dispatch(setShowExplain(!showExplain))}
          className={`
            inline-flex h-10 items-center rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
            ${
              showExplain
                ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                : "border-(--border) bg-(--surface) text-(--text) hover:border-(--primary) hover:text-(--primary)"
            }
            hover:bg-gray-200 dark:hover:bg-gray-600 dark:border-(--border) dark:bg-(--surface-dark)
            dark:hover:border-(--primary) dark:hover:text-(--primary)
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
