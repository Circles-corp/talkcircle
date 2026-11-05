import { BookOpen, Clapperboard, Trophy, type LucideIcon } from "lucide-react";
import type { CircleCategory } from "../../types/event.ts";

interface CategoryStyle {
  tileClass: string;
  icon: LucideIcon;
}

export const CATEGORY_STYLE: Record<CircleCategory, CategoryStyle> = {
  football: { tileClass: "bg-tint-teal", icon: Trophy },
  movies: { tileClass: "bg-tinit-pink", icon: Clapperboard },
  books: { tileClass: "bg-tint-amber", icon: BookOpen },
};
