import { emailSchema, type Booking } from "@gym/shared";
import { CalendarCheck, Hourglass, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useCancelBooking, useMyBookings } from "../api/hooks";
import { useIdentity } from "../lib/identity";
import { CATEGORY_STYLES, fmtDay, fmtTime } from "../lib/format";
import { EmptyState } from "./SchedulePage";

export function MyBookingsPage() {
  const [identity, setIdentity] = useIdentity();
  const bookings = useMyBookings(identity?.email ?? null);

  if (!identity) return <EmailLookup onSubmit={(email) => setIdentity({ name: "", email })} />;

  const now = new Date();
  const all = bookings.data ?? [];
  const upcoming = all.filter((b) => b.status !== "cancelled" && new Date(b.session.startsAt) > now);
  const history = all.filter((b) => !upcoming.includes(b)).reverse();

  return (
    <div className="pb-16 pt-8 sm:pt-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-volt-400">My bookings</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          {identity.name ? `Hey, ${identity.name.split(" ")[0]}` : "Your classes"}
        </h1>
        <p className="text-sm text-ink-400">
          {identity.email} ·{" "}
          <button className="text-volt-400 underline-offset-4 hover:underline" onClick={() => setIdentity(null)}>
            Not you?
          </button>
        </p>
      </div>

      {bookings.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-6 animate-spin text-ink-500" />
        </div>
      ) : bookings.isError ? (
        <div className="mt-8">
          <EmptyState title="Couldn't load your bookings" body={bookings.error.message} />
        </div>
      ) : (
        <>
          <Stats bookings={all} />
          <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-widest text-ink-500">Upcoming</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing booked yet"
              body="Your upcoming classes will show up here."
              action={
                <Link to="/" className="mt-4 inline-block rounded-xl bg-volt-400 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-volt-300">
                  Browse classes
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} email={identity.email} />
              ))}
            </div>
          )}

          {history.length > 0 && (
            <>
              <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-widest text-ink-500">Past & cancelled</h2>
              <div className="grid gap-3 opacity-70 sm:grid-cols-2">
                {history.map((b) => (
                  <BookingCard key={b.id} booking={b} email={identity.email} readOnly />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stats({ bookings }: { bookings: Booking[] }) {
  const now = new Date();
  const attended = bookings.filter((b) => b.status === "confirmed" && new Date(b.session.startsAt) <= now).length;
  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.session.startsAt) > now).length;
  const waitlisted = bookings.filter((b) => b.status === "waitlisted" && new Date(b.session.startsAt) > now).length;
  const items = [
    { label: "Upcoming", value: upcoming },
    { label: "Waitlisted", value: waitlisted },
    { label: "Completed", value: attended },
  ];
  return (
    <dl className="mt-6 grid grid-cols-3 gap-3">
      {items.map((i) => (
        <div key={i.label} className="rounded-2xl bg-ink-900/80 p-4 ring-1 ring-ink-700/50">
          <dt className="text-xs text-ink-500">{i.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold text-white">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BookingCard({ booking, email, readOnly }: { booking: Booking; email: string; readOnly?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelBooking();
  const { session, status } = booking;
  const style = CATEGORY_STYLES[session.classType.category];
  const past = new Date(session.startsAt) <= new Date();

  const badge =
    status === "confirmed" ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-volt-300">
        <CalendarCheck className="size-3.5" /> {past ? "Completed" : "Confirmed"}
      </span>
    ) : status === "waitlisted" ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
        <Hourglass className="size-3.5" /> {past ? "Missed (waitlist)" : `Waitlist #${booking.waitlistPosition}`}
      </span>
    ) : (
      <span className="text-xs font-semibold text-ink-500">Cancelled</span>
    );

  return (
    <article className="animate-fade-up rounded-2xl bg-ink-900/80 p-5 ring-1 ring-ink-700/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge}
          <h3 className="mt-1 font-display text-lg font-semibold text-white">{session.classType.name}</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${style.chip}`}>{session.classType.category}</span>
      </div>
      <p className="mt-2 text-sm text-ink-200">
        {fmtDay(session.startsAt)} · {fmtTime(session.startsAt)}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-400">
        <MapPin className="size-3.5" /> {session.room} · {session.trainer.name}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-ink-700/60 pt-3">
        <span className="font-mono text-sm tracking-widest text-ink-400">{booking.code}</span>
        {!readOnly &&
          (confirming ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 text-sm text-ink-400 hover:text-white">
                Keep
              </button>
              <button
                disabled={cancel.isPending}
                onClick={() =>
                  cancel.mutate(
                    { code: booking.code, email },
                    {
                      onSuccess: () => toast.success(`Cancelled ${session.classType.name}`),
                      onError: (err) => toast.error(err.message),
                      onSettled: () => setConfirming(false),
                    },
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-sm font-semibold text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/25 disabled:opacity-60"
              >
                {cancel.isPending && <Loader2 className="size-3.5 animate-spin" />}
                Yes, cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="rounded-lg px-3 py-1.5 text-sm text-ink-400 hover:bg-ink-800 hover:text-rose-300">
              {status === "waitlisted" ? "Leave waitlist" : "Cancel"}
            </button>
          ))}
      </div>
    </article>
  );
}

function EmailLookup({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  return (
    <div className="mx-auto max-w-md pb-16 pt-16 text-center sm:pt-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-volt-400">My bookings</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white">Find your classes</h1>
      <p className="mt-3 text-ink-400">Enter the email you booked with to see and manage your reservations.</p>
      <form
        noValidate
        className="mt-8 text-left"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = emailSchema.safeParse(email);
          if (!parsed.success) return setError(parsed.error.issues[0].message);
          onSubmit(parsed.data);
        }}
      >
        <label htmlFor="lookup-email" className="sr-only">
          Email
        </label>
        <div className="flex gap-2">
          <input id="lookup-email" type="email" autoComplete="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="shrink-0 rounded-xl bg-volt-400 px-5 font-semibold text-ink-950 hover:bg-volt-300">Look up</button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </form>
    </div>
  );
}
