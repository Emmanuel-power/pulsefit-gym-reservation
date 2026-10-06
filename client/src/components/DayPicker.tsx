import { addDays, format, isSameDay, startOfDay } from "date-fns";

interface Props {
  value: Date;
  onChange: (day: Date) => void;
  days?: number;
}

export function DayPicker({ value, onChange, days = 14 }: Props) {
  const today = startOfDay(new Date());
  const options = Array.from({ length: days }, (_, i) => addDays(today, i));

  return (
    <div role="tablist" aria-label="Choose a day" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {options.map((day, i) => {
        const selected = isSameDay(day, value);
        return (
          <button
            key={day.toISOString()}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(day)}
            className={`flex min-w-16 shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 transition ${
              selected
                ? "bg-volt-400 text-ink-950 shadow-lg shadow-volt-400/20"
                : "bg-ink-850 text-ink-400 ring-1 ring-ink-700/60 hover:bg-ink-800 hover:text-ink-200"
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {i === 0 ? "Today" : format(day, "EEE")}
            </span>
            <span className="font-display text-xl font-bold leading-tight">{format(day, "d")}</span>
            <span className={`text-[10px] ${selected ? "text-ink-900/70" : "text-ink-500"}`}>{format(day, "MMM")}</span>
          </button>
        );
      })}
    </div>
  );
}
