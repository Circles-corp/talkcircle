import {
  Compass,
  House,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "../../app/routes.ts";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.home, label: "Home", icon: House },
  { to: ROUTES.explore, label: "Explore", icon: Compass },
  { to: ROUTES.chats, label: "Chats", icon: MessageCircle },
  { to: ROUTES.profile, label: "Profile", icon: User },
];
