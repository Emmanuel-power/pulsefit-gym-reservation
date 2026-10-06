import type { Category, ClassType, Session, Trainer } from "@gym/shared";
import type { DB } from "../db.ts";

interface SessionRow {
  id: number;
  starts_at: string;
  room: string;
  capacity: number;
  booked: number;
  waitlisted: number;
  ct_id: number;
  ct_slug: string;
  ct_name: string;
  ct_category: Category;
  ct_description: string;
  ct_intensity: 1 | 2 | 3;
  ct_duration_min: number;
  t_id: number;
  t_name: string;
  t_specialty: string;
  t_bio: string;
}

export const SESSION_SELECT = `
  SELECT
    s.id, s.starts_at, s.room, s.capacity,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed')  AS booked,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'waitlisted') AS waitlisted,
    ct.id AS ct_id, ct.slug AS ct_slug, ct.name AS ct_name, ct.category AS ct_category,
    ct.description AS ct_description, ct.intensity AS ct_intensity, ct.duration_min AS ct_duration_min,
    t.id AS t_id, t.name AS t_name, t.specialty AS t_specialty, t.bio AS t_bio
  FROM sessions s
  JOIN class_types ct ON ct.id = s.class_type_id
  JOIN trainers t     ON t.id  = s.trainer_id
`;

export function mapSession(row: SessionRow): Session {
  const start = new Date(row.starts_at);
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: new Date(start.getTime() + row.ct_duration_min * 60_000).toISOString(),
    room: row.room,
    capacity: row.capacity,
    booked: row.booked,
    waitlisted: row.waitlisted,
    spotsLeft: Math.max(0, row.capacity - row.booked),
    classType: {
      id: row.ct_id,
      slug: row.ct_slug,
      name: row.ct_name,
      category: row.ct_category,
      description: row.ct_description,
      intensity: row.ct_intensity,
      durationMin: row.ct_duration_min,
    },
    trainer: { id: row.t_id, name: row.t_name, specialty: row.t_specialty, bio: row.t_bio },
  };
}

export function listSessions(db: DB, opts: { from: string; to: string; category?: Category }): Session[] {
  const rows = db
    .prepare(
      `${SESSION_SELECT}
       WHERE s.starts_at >= @from AND s.starts_at < @to
         AND (@category IS NULL OR ct.category = @category)
       ORDER BY s.starts_at, ct.name`,
    )
    .all({
      from: new Date(opts.from).toISOString(),
      to: new Date(opts.to).toISOString(),
      category: opts.category ?? null,
    }) as SessionRow[];
  return rows.map(mapSession);
}

export function getSession(db: DB, id: number): Session | undefined {
  const row = db.prepare(`${SESSION_SELECT} WHERE s.id = ?`).get(id) as SessionRow | undefined;
  return row && mapSession(row);
}

export function listTrainers(db: DB): Trainer[] {
  return db.prepare(`SELECT id, name, specialty, bio FROM trainers ORDER BY name`).all() as Trainer[];
}

export function listClassTypes(db: DB): ClassType[] {
  return db
    .prepare(
      `SELECT id, slug, name, category, description, intensity, duration_min AS durationMin
       FROM class_types ORDER BY category, name`,
    )
    .all() as ClassType[];
}
