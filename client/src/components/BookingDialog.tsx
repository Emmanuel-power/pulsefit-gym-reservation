import { createBookingSchema, type Booking, type Session } from "@gym/shared";
import { CalendarCheck, Copy, Hourglass, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useCreateBooking } from "../api/hooks";
import { useIdentity } from "../lib/identity";
import { fmtDay, fmtTime } from "../lib/format";

interface Props {
  session: Session | null;
  onClose: () => void;
}

export function BookingDialog({ session, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (session && !dialog.open) dialog.showModal();
    if (!session && dialog.open) dialog.close();
  }, [session]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-ink-900 p-0 text-ink-200 shadow-2xl ring-1 ring-ink-700 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {/* Remount per session so form state resets */}
      {session && <BookingForm key={session.id} session={session} onClose={onClose} />}
    </dialog>
  );
}

function BookingForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const [identity, setIdentity] = useIdentity();
  const [name, setName] = useState(identity?.name ?? "");
  const [email, setEmail] = useState(identity?.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [result, setResult] = useState<Booking | null>(null);
  const create = useCreateBooking();
  const id = useId();
  const full = session.spotsLeft === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createBookingSchema.safeParse({ sessionId: session.id, name, email });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as "name" | "email";
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (booking) => {
        setIdentity({ name: parsed.data.name, email: parsed.data.email });
        setResult(booking);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  const header = (
    <div className="relative border-b border-ink-700/60 p-6 pb-5">
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white">
        <X className="size-5" />
      </button>
      <p className="text-xs font-semibold uppercase tracking-wider text-volt-400">{session.classType.category}</p>
      <h2 className="mt-1 font-display text-2xl font-bold text-white">{session.classType.name}</h2>
      <p className="mt-1 text-sm text-ink-400">
        {fmtDay(session.startsAt)} · {fmtTime(session.startsAt)}–{fmtTime(session.endsAt)} · {session.room}
      </p>
      <p className="text-sm text-ink-400">with {session.trainer.name}</p>
    </div>
  );

  if (result) {
    const waitlisted = result.status === "waitlisted";
    return (
      <div>
        {header}
        <div className="p-6 text-center">
          <div className={`mx-auto grid size-14 place-items-center rounded-full ${waitlisted ? "bg-amber-400/15 text-amber-300" : "bg-volt-400/15 text-volt-400"}`}>
            {waitlisted ? <Hourglass className="size-7" /> : <CalendarCheck className="size-7" />}
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-white">
            {waitlisted ? `You're #${result.waitlistPosition} on the waitlist` : "You're booked!"}
          </h3>
          <p className="mt-1 text-sm text-ink-400">
            {waitlisted
              ? "If a spot opens up you'll be moved in automatically."
              : "See you there. Arrive 5 minutes early to grab your spot."}
          </p>
          <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-ink-850 p-4 ring-1 ring-ink-700">
            <p className="text-xs uppercase tracking-wider text-ink-500">Booking code</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{result.code}</span>
              <button
                aria-label="Copy booking code"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-700 hover:text-white"
                onClick={() => navigator.clipboard?.writeText(result.code).then(() => toast.success("Code copied"))}
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link to="/my-bookings" onClick={onClose} className="flex-1 rounded-xl bg-ink-800 py-3 text-sm font-semibold text-ink-200 ring-1 ring-ink-700 hover:bg-ink-700">
              My bookings
            </Link>
            <button onClick={onClose} className="flex-1 rounded-xl bg-volt-400 py-3 text-sm font-semibold text-ink-950 hover:bg-volt-300">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {header}
      <div className="space-y-4 p-6">
        {full && (
          <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200 ring-1 ring-amber-400/25">
            This class is full. Join the waitlist and we'll move you in automatically if someone cancels
            {session.waitlisted > 0 && ` (${session.waitlisted} ahead of you)`}.
          </p>
        )}
        <Field id={`${id}-name`} label="Your name" error={errors.name}>
          <input
            id={`${id}-name`}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Smith"
            className="input"
            autoFocus={!name}
          />
        </Field>
        <Field id={`${id}-email`} label="Email" error={errors.email} hint="Used to look up or cancel your booking. No account needed.">
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </Field>
        <button
          type="submit"
          disabled={create.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-volt-400 py-3 font-semibold text-ink-950 transition hover:bg-volt-300 disabled:opacity-60"
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          {full ? "Join waitlist" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-200">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
