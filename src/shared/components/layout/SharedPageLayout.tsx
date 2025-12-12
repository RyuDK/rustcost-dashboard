import type { ReactNode } from "react";

interface SharedPageLayoutProps {
  children: ReactNode;
}

export const SharedPageLayout = ({ children }: SharedPageLayoutProps) => {
  return <div className="flex flex-col gap-8">{children}</div>;
};
