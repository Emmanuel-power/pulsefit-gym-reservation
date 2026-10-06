import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trainers (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  specialty   TEXT NOT NULL,
  bio         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS class_types (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  intensity     INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 3),
  duration_min  INTEGER NOT NULL CHECK (duration_min > 0)
);

CREATE TABLE IF NOT EXISTS sessions (
  id             INTEGER PRIMARY KEY,
  class_type_id  INTEGER NOT NULL REFERENCES class_types(id),
  trainer_id     INTEGER NOT NULL REFERENCES trainers(id),
  starts_at      TEXT NOT NULL,
  room           TEXT NOT NULL,
  capacity       INTEGER NOT NULL CHECK (capacity > 0),
  UNIQUE (room, starts_at)
);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON sessions(starts_at);

CREATE TABLE IF NOT EXISTS bookings (
  id            INTEGER PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  created_at    TEXT NOT NULL,
  cancelled_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
-- One active (non-cancelled) booking per person per session.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active
  ON bookings(session_id, email) WHERE status <> 'cancelled';
`;

export function openDb(file: string = process.env.DATABASE_FILE ?? "data/gym.db"): DB {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
