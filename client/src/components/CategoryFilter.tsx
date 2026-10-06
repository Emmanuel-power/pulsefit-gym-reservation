import { CATEGORIES, type Category } from "@gym/shared";
import { CATEGORY_STYLES } from "../lib/format";

interface Props {
  value: Category | undefined;
  onChange: (c: Category | undefined) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  const chip = (active: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-ink-200 text-ink-950" : "bg-ink-850 text-ink-400 ring-1 ring-ink-700/60 hover:text-ink-200"
    }`;

  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
      <button className={chip(!value)} aria-pressed={!value} onClick={() => onChange(undefined)}>
        All classes
      </button>
      {CATEGORIES.map((c) => (
        <button key={c} className={chip(value === c)} aria-pressed={value === c} onClick={() => onChange(value === c ? undefined : c)}>
          <span className={`size-2 rounded-full ${CATEGORY_STYLES[c].dot}`} />
          {c}
        </button>
      ))}
    </div>
  );
}
