import { randomBytes } from "node:crypto";
import type { Category } from "@gym/shared";
import type { DB } from "./db.ts";

const TRAINERS = [
  { slug: "maya", name: "Maya Okafor", specialty: "Strength & Conditioning", bio: "Former collegiate sprinter who loves a heavy barbell and a clean progression plan." },
  { slug: "leo", name: "Leo Brandt", specialty: "Indoor Cycling", bio: "Builds every ride around a playlist. Bring water, leave nothing in the tank." },
  { slug: "priya", name: "Priya Raman", specialty: "Yoga & Mobility", bio: "500-hour certified vinyasa teacher focused on breath, balance and longevity." },
  { slug: "dante", name: "Dante Reyes", specialty: "Boxing", bio: "Amateur boxing champion teaching footwork, combos and conditioning." },
  { slug: "sofia", name: "Sofia Lind", specialty: "Pilates & Core", bio: "Physio-trained Pilates instructor obsessed with control and posture." },
  { slug: "kwame", name: "Kwame Mensah", specialty: "HIIT & Metabolic", bio: "Short, sharp, sweaty. Every session is scalable for every level." },
] as const;

const CLASS_TYPES: {
  slug: string;
  name: string;
  category: Category;
  description: string;
  intensity: 1 | 2 | 3;
  durationMin: number;
}[] = [
  { slug: "power-lift", name: "Power Lift", category: "Strength", description: "Coached barbell session: squat, press and pull with progressive loading.", intensity: 3, durationMin: 60 },
  { slug: "full-body-burn", name: "Full Body Burn", category: "Strength", description: "Dumbbells, kettlebells and bodyweight circuits for total-body strength.", intensity: 2, durationMin: 45 },
  { slug: "hiit-45", name: "HIIT 45", category: "HIIT", description: "Interval training alternating all-out effort with short recoveries.", intensity: 3, durationMin: 45 },
  { slug: "tabata-blast", name: "Tabata Blast", category: "HIIT", description: "20 seconds on, 10 off. Eight rounds. Repeat until legendary.", intensity: 3, durationMin: 30 },
  { slug: "rhythm-ride", name: "Rhythm Ride", category: "Cycling", description: "Beat-driven indoor cycling with climbs, sprints and choreography.", intensity: 2, durationMin: 45 },
  { slug: "endurance-ride", name: "Endurance Ride", category: "Cycling", description: "Power-zone based ride to build your aerobic engine.", intensity: 3, durationMin: 60 },
  { slug: "vinyasa-flow", name: "Vinyasa Flow", category: "Yoga", description: "Breath-linked movement building heat, strength and flexibility.", intensity: 2, durationMin: 60 },
  { slug: "restorative-yoga", name: "Restorative Yoga", category: "Yoga", description: "Slow, supported postures to unwind the nervous system.", intensity: 1, durationMin: 60 },
  { slug: "mat-pilates", name: "Mat Pilates", category: "Pilates", description: "Classic Pilates repertoire for a strong core and better posture.", intensity: 1, durationMin: 45 },
  { slug: "boxing-fundamentals", name: "Boxing Fundamentals", category: "Boxing", description: "Stance, footwork and combinations on the heavy bags. Gloves provided.", intensity: 2, durationMin: 60 },
  { slug: "box-n-burn", name: "Box & Burn", category: "Boxing", description: "Bag rounds mixed with conditioning finishers.", intensity: 3, durationMin: 45 },
  { slug: "cardio-dance", name: "Cardio Dance", category: "Cardio", description: "Feel-good dance cardio. No rhythm required, just enthusiasm.", intensity: 2, durationMin: 45 },
];

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
const MWF: Weekday[] = [1, 3, 5];
const TTH: Weekday[] = [2, 4];
const WEEKEND: Weekday[] = [0, 6];

/** Weekly timetable; materialized into concrete sessions for a rolling window. */
const TIMETABLE: {
  days: Weekday[];
  time: string;
  classSlug: string;
  trainerSlug: (typeof TRAINERS)[number]["slug"];
  room: string;
  capacity: number;
}[] = [
  { days: WEEKDAYS, time: "06:00", classSlug: "rhythm-ride", trainerSlug: "leo", room: "Cycle Studio", capacity: 20 },
  { days: MWF, time: "06:30", classSlug: "power-lift", trainerSlug: "maya", room: "Strength Floor", capacity: 10 },
  { days: TTH, time: "06:30", classSlug: "hiit-45", trainerSlug: "kwame", room: "Studio A", capacity: 16 },
  { days: WEEKDAYS, time: "07:30", classSlug: "vinyasa-flow", trainerSlug: "priya", room: "Studio B", capacity: 18 },
  { days: TTH, time: "09:00", classSlug: "mat-pilates", trainerSlug: "sofia", room: "Studio B", capacity: 12 },
  { days: MWF, time: "12:00", classSlug: "tabata-blast", trainerSlug: "kwame", room: "Studio A", capacity: 16 },
  { days: TTH, time: "12:15", classSlug: "full-body-burn", trainerSlug: "maya", room: "Strength Floor", capacity: 12 },
  { days: WEEKDAYS, time: "17:30", classSlug: "endurance-ride", trainerSlug: "leo", room: "Cycle Studio", capacity: 20 },
  { days: MWF, time: "18:00", classSlug: "boxing-fundamentals", trainerSlug: "dante", room: "Boxing Ring", capacity: 14 },
  { days: TTH, time: "18:00", classSlug: "box-n-burn", trainerSlug: "dante", room: "Boxing Ring", capacity: 14 },
  { days: WEEKDAYS, time: "18:30", classSlug: "hiit-45", trainerSlug: "kwame", room: "Studio A", capacity: 16 },
  { days: MWF, time: "19:30", classSlug: "restorative-yoga", trainerSlug: "priya", room: "Studio B", capacity: 18 },
  { days: TTH, time: "19:30", classSlug: "cardio-dance", trainerSlug: "sofia", room: "Studio A", capacity: 20 },
  { days: WEEKEND, time: "08:00", classSlug: "rhythm-ride", trainerSlug: "leo", room: "Cycle Studio", capacity: 20 },
  { days: WEEKEND, time: "09:00", classSlug: "power-lift", trainerSlug: "maya", room: "Strength Floor", capacity: 10 },
  { days: WEEKEND, time: "10:00", classSlug: "vinyasa-flow", trainerSlug: "priya", room: "Studio B", capacity: 18 },
  { days: [6], time: "11:00", classSlug: "box-n-burn", trainerSlug: "dante", room: "Boxing Ring", capacity: 14 },
  { days: [0], time: "11:00", classSlug: "mat-pilates", trainerSlug: "sofia", room: "Studio B", capacity: 12 },
];

const FIRST_NAMES = ["Alex", "Sam", "Jordan", "Taylor", "Chris", "Morgan", "Jamie", "Riley", "Casey", "Avery", "Quinn", "Drew"];

export const SCHEDULE_DAYS = 14;

export interface SeedOptions {
  now?: Date;
  /** Pre-fill sessions with demo bookings so the schedule looks lived-in. */
  demoBookings?: boolean;
}

/** Idempotently inserts trainers & class types, then makes sure the next two weeks of sessions exist. */
export function ensureSeeded(db: DB, { now = new Date(), demoBookings = true }: SeedOptions = {}) {
  const insertTrainer = db.prepare(
    `INSERT INTO trainers (slug, name, specialty, bio) VALUES (@slug, @name, @specialty, @bio)
     ON CONFLICT(slug) DO NOTHING`,
  );
  const insertClass = db.prepare(
    `INSERT INTO class_types (slug, name, category, description, intensity, duration_min)
     VALUES (@slug, @name, @category, @description, @intensity, @durationMin)
     ON CONFLICT(slug) DO NOTHING`,
  );
  const insertSession = db.prepare(
    `INSERT INTO sessions (class_type_id, trainer_id, starts_at, room, capacity)
     VALUES (
       (SELECT id FROM class_types WHERE slug = ?),
       (SELECT id FROM trainers WHERE slug = ?),
       ?, ?, ?
     )
     ON CONFLICT(room, starts_at) DO NOTHING`,
  );
  const insertBooking = db.prepare(
    `INSERT INTO bookings (session_id, code, name, email, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  let created = 0;
  db.transaction(() => {
    TRAINERS.forEach((t) => insertTrainer.run(t));
    CLASS_TYPES.forEach((c) => insertClass.run(c));

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let offset = 0; offset < SCHEDULE_DAYS; offset++) {
      const day = new Date(today);
      day.setDate(today.getDate() + offset);
      const weekday = day.getDay() as Weekday;

      for (const slot of TIMETABLE) {
        if (!slot.days.includes(weekday)) continue;
        const [h, m] = slot.time.split(":").map(Number);
        const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
        const result = insertSession.run(slot.classSlug, slot.trainerSlug, startsAt.toISOString(), slot.room, slot.capacity);
        if (result.changes === 0) continue;
        created++;

        if (demoBookings) {
          const sessionId = Number(result.lastInsertRowid);
          // Deterministic pseudo-random fill between ~15% and ~115% of capacity.
          const fill = 0.15 + (((sessionId * 2654435761) >>> 0) % 1000) / 1000;
          const count = Math.round(slot.capacity * fill);
          for (let i = 0; i < count; i++) {
            const name = FIRST_NAMES[(sessionId + i) % FIRST_NAMES.length];
            insertBooking.run(
              sessionId,
              generateBookingCode(),
              `${name} ${String.fromCharCode(65 + ((sessionId * 7 + i) % 26))}.`,
              `member${sessionId}-${i}@example.com`,
              i < slot.capacity ? "confirmed" : "waitlisted",
              now.toISOString(),
            );
          }
        }
      }
    }
  })();
  return { sessionsCreated: created };
}

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read aloud at the front desk.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateBookingCode(length = 6) {
  const bytes = randomBytes(length);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}
