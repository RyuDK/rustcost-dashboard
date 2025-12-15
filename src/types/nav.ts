import type { IconType } from "react-icons";

export type NavItem = {
  to?: string;
  translationKey: string;
  icon: IconType;
  children?: NavItem[];
};
