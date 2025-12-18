import type { ReactNode } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { useAppSelector } from "@/store/hook";

interface ExplainHintProps {
  children: ReactNode;
  /** Override global visibility; defaults to Redux preference */
  visible?: boolean;
}

export const ExplainHint = ({ children, visible }: ExplainHintProps) => {
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const shouldShow = visible ?? showExplain;

  if (!shouldShow) return null;

  return (
    <div
      className="
        flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed
        border-slate-200 bg-slate-50 text-slate-700 shadow-sm
        dark:border-amber-400/40
        dark:bg-transparent
        dark:bg-linear-to-r dark:from-black/80 dark:via-black/70 dark:to-amber-900/20
        dark:text-white
        dark:shadow-[0_12px_30px_-16px_rgba(0,0,0,0.6)]
        dark:backdrop-blur
      "
    >
      <span className="mt-0.5 text-blue-600 dark:text-amber-300">
        <IoInformationCircle className="text-base" />
      </span>

      <p className="text-slate-700 dark:text-white/90">{children}</p>
    </div>
  );
};
