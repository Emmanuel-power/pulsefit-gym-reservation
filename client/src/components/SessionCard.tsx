import type { Booking, Session } from "@gym/shared";
import { Check, Clock, Hourglass, MapPin } from "lucide-react";
import { CATEGORY_STYLES, fmtTime, initials } from "../lib/format";
import { CapacityBar } from "./CapacityBar";
import { Intensity } from "./Intensity";

interface Props {
  session: Session;
  myBooking?: Booking;
  onBook: (session: Session) => void;
}

export function SessionCard({ session, myBooking, onBook }: Props) {
  const started = new Date(session.startsAt) <= new Date();
  const full = session.spotsLeft === 0;
  const { classType, trainer } = session;
  const style = CATEGORY_STYLES[classType.category];

  let action: React.ReactNode;
  if (myBooking?.status === "confirmed") {
    action = (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-volt-400/15 px-4 py-2.5 text-sm font-semibold text-volt-300 ring-1 ring-volt-400/30">
        <Check className="size-4" /> You're in
      </span>
    );
  } else if (myBooking?.status === "waitlisted") {
    action = (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/25">
        <Hourglass className="size-4" /> Waitlist #{myBooking.waitlistPosition}
      </span>
    );
  } else if (started) {
    action = <span className="px-4 py-2.5 text-sm text-ink-500">Started</span>;
  } else {
    action = (
      <button
        onClick={() => onBook(session)}
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
          full
            ? "bg-ink-800 text-ink-200 ring-1 ring-ink-700 hover:bg-ink-700"
            : "bg-volt-400 text-ink-950 hover:bg-volt-300"
        }`}
      >
        {full ? "Join waitlist" : "Book"}
      </button>
    );
  }

  return (
    <article
      className={`group animate-fade-up rounded-2xl bg-ink-900/80 p-4 ring-1 ring-ink-700/50 backdrop-blur transition hover:ring-ink-700 sm:p-5 ${
        started && !myBooking ? "opacity-50" : ""
      }`}
    >
      <div className="flex gap-4 sm:gap-6">
        <div className="w-[4.5rem] shrink-0 sm:w-24">
          <p className="whitespace-nowrap font-display text-base font-bold leading-tight text-white sm:text-xl">{fmtTime(session.startsAt)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
            <Clock className="size-3" /> {classType.durationMin} min
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-white">{classType.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${style.chip}`}>{classType.category}</span>
            <Intensity level={classType.intensity} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink-400">{classType.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-400">
            <span className="flex items-center gap-2" title={trainer.bio}>
              <span className="grid size-6 place-items-center rounded-full bg-ink-700 text-[10px] font-bold text-ink-200">
                {initials(trainer.name)}
              </span>
              {trainer.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {session.room}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex-1 sm:max-w-xs">
              <CapacityBar session={session} />
            </div>
            <div className="sm:ml-auto">{action}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-ink-900/80 p-5 ring-1 ring-ink-700/50">
      <div className="flex gap-6">
        <div className="h-6 w-16 rounded bg-ink-800" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-40 rounded bg-ink-800" />
          <div className="h-4 w-full max-w-md rounded bg-ink-800" />
          <div className="h-1.5 w-full max-w-xs rounded bg-ink-800" />
        </div>
      </div>
    </div>
  );
}
