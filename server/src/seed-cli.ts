import fs from "node:fs";
import { openDb } from "./db.ts";
import { ensureSeeded } from "./seed.ts";

// Resets the database and seeds a fresh two-week schedule.
const file = process.env.DATABASE_FILE ?? "data/gym.db";
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });

const db = openDb(file);
const { sessionsCreated } = ensureSeeded(db);
console.log(`Database reset at ${file} with ${sessionsCreated} sessions`);
db.close();
