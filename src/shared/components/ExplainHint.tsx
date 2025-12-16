import type { ReactNode } from "react";
import { IoInformationCircle } from "react-icons/io5";

interface ExplainHintProps {
  children: ReactNode;
}

export const ExplainHint = ({ children }: ExplainHintProps) => (
  <div
    className="
      flex items-start gap-3 rounded-xl border border-amber-400/40
      bg-linear-to-r from-black/80 via-black/70 to-amber-900/20
      px-4 py-3 text-xs text-white shadow-[0_12px_30px_-16px_rgba(0,0,0,0.6)] backdrop-blur
    "
  >
    <span className="mt-0.5 text-amber-300">
      <IoInformationCircle className="text-base" />
    </span>

    <p className="text-white/90 leading-relaxed">{children}</p>
  </div>
);
