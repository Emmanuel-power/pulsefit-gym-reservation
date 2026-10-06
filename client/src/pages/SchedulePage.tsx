import type { Booking, Category, Session } from "@gym/shared";
import { startOfDay } from "date-fns";
import { CalendarX2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useMyBookings, useSessions } from "../api/hooks";
import { BookingDialog } from "../components/BookingDialog";
import { CategoryFilter } from "../components/CategoryFilter";
import { DayPicker } from "../components/DayPicker";
import { SessionCard, SessionCardSkeleton } from "../components/SessionCard";
import { useIdentity } from "../lib/identity";

export function SchedulePage() {
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [category, setCategory] = useState<Category>();
  const [selected, setSelected] = useState<Session | null>(null);
  const [identity] = useIdentity();

  const sessions = useSessions(day, category);
  const myBookings = useMyBookings(identity?.email ?? null);

  const bookingBySession = useMemo(() => {
    const map = new Map<number, Booking>();
    for (const b of myBookings.data ?? []) if (b.status !== "cancelled") map.set(b.session.id, b);
    return map;
  }, [myBookings.data]);

  const groups = useMemo(() => groupByPartOfDay(sessions.data ?? []), [sessions.data]);

  return (
    <>
      <section className="pt-8 sm:pt-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-volt-400">Class schedule</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find your next sweat.
        </h1>
        <p className="mt-3 max-w-xl text-ink-400">
          Reserve a spot in seconds. No account, no app download. Just your name and email.
        </p>
      </section>

      <section className="sticky top-16 z-10 -mx-4 mt-8 space-y-3 bg-ink-950/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <DayPicker value={day} onChange={setDay} />
        <CategoryFilter value={category} onChange={setCategory} />
      </section>

      <section className="mt-4 pb-16" aria-live="polite" aria-busy={sessions.isLoading}>
        {sessions.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => <SessionCardSkeleton key={i} />)}
          </div>
        ) : sessions.isError ? (
          <EmptyState
            title="Couldn't load the schedule"
            body={sessions.error.message}
            action={
              <button onClick={() => sessions.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink-800 px-4 py-2 text-sm font-semibold ring-1 ring-ink-700 hover:bg-ink-700">
                <RefreshCw className="size-4" /> Try again
              </button>
            }
          />
        ) : groups.length === 0 ? (
          <EmptyState title="No classes here" body={category ? `No ${category} classes on this day. Try another day or category.` : "Nothing scheduled on this day."} />
        ) : (
          <div className={`space-y-8 transition-opacity ${sessions.isPlaceholderData ? "opacity-60" : ""}`}>
            {groups.map(([label, items]) => (
              <div key={label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-500">
                  {label} <span className="text-ink-700">· {items.length}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((s) => (
                    <SessionCard key={s.id} session={s} myBooking={bookingBySession.get(s.id)} onBook={setSelected} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookingDialog session={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function groupByPartOfDay(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  for (const s of sessions) {
    const h = new Date(s.startsAt).getHours();
    const label = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
    (groups[label] ??= []).push(s);
  }
  return Object.entries(groups);
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-700 px-6 py-16 text-center">
      <CalendarX2 className="mx-auto size-10 text-ink-500" />
      <h3 className="mt-4 font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-ink-400">{body}</p>
      {action}
    </div>
  );
}
