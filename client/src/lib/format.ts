import type { Category } from "@gym/shared";
import { format } from "date-fns";

export const fmtTime = (iso: string) => format(new Date(iso), "h:mm a");
export const fmtDay = (iso: string) => format(new Date(iso), "EEE, MMM d");

export const CATEGORY_STYLES: Record<Category, { dot: string; chip: string }> = {
  Strength: { dot: "bg-orange-400", chip: "text-orange-300 bg-orange-400/10 ring-orange-400/25" },
  HIIT: { dot: "bg-rose-400", chip: "text-rose-300 bg-rose-400/10 ring-rose-400/25" },
  Cycling: { dot: "bg-sky-400", chip: "text-sky-300 bg-sky-400/10 ring-sky-400/25" },
  Yoga: { dot: "bg-emerald-400", chip: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/25" },
  Pilates: { dot: "bg-violet-400", chip: "text-violet-300 bg-violet-400/10 ring-violet-400/25" },
  Boxing: { dot: "bg-red-500", chip: "text-red-300 bg-red-500/10 ring-red-500/25" },
  Cardio: { dot: "bg-amber-300", chip: "text-amber-200 bg-amber-300/10 ring-amber-300/25" },
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
