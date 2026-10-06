import type { Booking, BookingStatus, CreateBookingInput } from "@gym/shared";
import type { DB } from "../db.ts";
import { generateBookingCode } from "../seed.ts";
import { HttpError } from "../errors.ts";
import { getSession } from "./schedule.ts";

interface BookingRow {
  id: number;
  session_id: number;
  code: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
  waitlist_position: number | null;
}

const BOOKING_SELECT = `
  SELECT b.*,
    CASE WHEN b.status = 'waitlisted' THEN (
      SELECT COUNT(*) + 1 FROM bookings w
      WHERE w.session_id = b.session_id AND w.status = 'waitlisted' AND w.id < b.id
    ) END AS waitlist_position
  FROM bookings b
`;

function toBooking(db: DB, row: BookingRow): Booking {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    email: row.email,
    status: row.status,
    waitlistPosition: row.waitlist_position,
    createdAt: row.created_at,
    session: getSession(db, row.session_id)!,
  };
}

function getBookingByCode(db: DB, code: string) {
  return db.prepare(`${BOOKING_SELECT} WHERE b.code = ?`).get(code) as BookingRow | undefined;
}

/**
 * Books a spot, or joins the waitlist when the class is full.
 * Runs in an IMMEDIATE transaction so concurrent requests can't oversell a class.
 */
export function createBooking(db: DB, input: CreateBookingInput, now = new Date()): Booking {
  const row = db
    .transaction(() => {
      const session = getSession(db, input.sessionId);
      if (!session) throw new HttpError(404, "That class doesn't exist");
      if (new Date(session.startsAt) <= now) {
        throw new HttpError(400, "This class has already started");
      }

      const existing = db
        .prepare(`SELECT status FROM bookings WHERE session_id = ? AND email = ? AND status <> 'cancelled'`)
        .get(session.id, input.email) as { status: BookingStatus } | undefined;
      if (existing) {
        throw new HttpError(
          409,
          existing.status === "confirmed"
            ? "You're already booked into this class"
            : "You're already on the waitlist for this class",
        );
      }

      const status: BookingStatus = session.booked < session.capacity ? "confirmed" : "waitlisted";
      const insert = db.prepare(
        `INSERT INTO bookings (session_id, code, name, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      );
      // Codes are random; retry on the (very unlikely) collision.
      for (let attempt = 0; ; attempt++) {
        try {
          const code = generateBookingCode();
          insert.run(session.id, code, input.name, input.email, status, now.toISOString());
          return getBookingByCode(db, code)!;
        } catch (err) {
          const isCodeClash = err instanceof Error && err.message.includes("bookings.code");
          if (!isCodeClash || attempt >= 5) throw err;
        }
      }
    })
    .immediate();
  return toBooking(db, row);
}

/** Cancels a booking. If it held a confirmed spot, the first person on the waitlist is promoted. */
export function cancelBooking(db: DB, code: string, email: string, now = new Date()): Booking {
  const row = db
    .transaction(() => {
      const booking = getBookingByCode(db, code.toUpperCase());
      // Same error for "wrong code" and "wrong email" so codes can't be probed.
      if (!booking || booking.email !== email) throw new HttpError(404, "No booking found for that code and email");
      if (booking.status === "cancelled") throw new HttpError(409, "This booking is already cancelled");

      const session = getSession(db, booking.session_id)!;
      if (new Date(session.startsAt) <= now) {
        throw new HttpError(400, "You can't cancel a class that has already started");
      }

      db.prepare(`UPDATE bookings SET status = 'cancelled', cancelled_at = ? WHERE id = ?`).run(
        now.toISOString(),
        booking.id,
      );

      if (booking.status === "confirmed") {
        db.prepare(
          `UPDATE bookings SET status = 'confirmed'
           WHERE id = (
             SELECT id FROM bookings WHERE session_id = ? AND status = 'waitlisted' ORDER BY id LIMIT 1
           )`,
        ).run(booking.session_id);
      }
      return getBookingByCode(db, booking.code)!;
    })
    .immediate();
  return toBooking(db, row);
}

export function listBookingsByEmail(db: DB, email: string): Booking[] {
  const rows = db
    .prepare(
      `${BOOKING_SELECT}
       JOIN sessions s ON s.id = b.session_id
       WHERE b.email = ?
       ORDER BY s.starts_at`,
    )
    .all(email) as BookingRow[];
  return rows.map((r) => toBooking(db, r));
}
