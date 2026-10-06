import type { Session } from "@gym/shared";

export function CapacityBar({ session }: { session: Session }) {
  const pct = Math.min(100, (session.booked / session.capacity) * 100);
  const full = session.spotsLeft === 0;
  const low = !full && session.spotsLeft <= 3;
  const color = full ? "bg-rose-400" : low ? "bg-amber-400" : "bg-volt-400";

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className={full ? "font-medium text-rose-300" : low ? "font-medium text-amber-300" : "text-ink-400"}>
          {full
            ? session.waitlisted > 0
              ? `Full · ${session.waitlisted} on waitlist`
              : "Full · waitlist open"
            : `${session.spotsLeft} ${session.spotsLeft === 1 ? "spot" : "spots"} left`}
        </span>
        <span className="tabular-nums text-ink-500">
          {session.booked}/{session.capacity}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-ink-700/70"
        role="progressbar"
        aria-label="Class capacity"
        aria-valuemin={0}
        aria-valuemax={session.capacity}
        aria-valuenow={session.booked}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
