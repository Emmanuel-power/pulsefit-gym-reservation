import { z } from "zod";

export const CATEGORIES = [
  "Strength",
  "HIIT",
  "Cycling",
  "Yoga",
  "Pilates",
  "Boxing",
  "Cardio",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type BookingStatus = "confirmed" | "waitlisted" | "cancelled";

export interface Trainer {
  id: number;
  name: string;
  specialty: string;
  bio: string;
}

export interface ClassType {
  id: number;
  slug: string;
  name: string;
  category: Category;
  description: string;
  /** 1 = easy, 2 = moderate, 3 = intense */
  intensity: 1 | 2 | 3;
  durationMin: number;
}

export interface Session {
  id: number;
  startsAt: string;
  endsAt: string;
  room: string;
  capacity: number;
  booked: number;
  waitlisted: number;
  spotsLeft: number;
  classType: ClassType;
  trainer: Trainer;
}

export interface Booking {
  id: number;
  code: string;
  name: string;
  email: string;
  status: BookingStatus;
  /** 1-based position in the waitlist; null unless status is "waitlisted" */
  waitlistPosition: number | null;
  createdAt: string;
  session: Session;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

// ---- Request schemas (validated on the server, reused for client-side forms) ----

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const createBookingSchema = z.object({
  sessionId: z.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: emailSchema,
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  email: emailSchema,
});

export const sessionsQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
  category: z.enum(CATEGORIES).optional(),
});
