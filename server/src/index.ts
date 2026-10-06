import { createApp, DEFAULT_STATIC_DIR } from "./app.ts";
import { openDb } from "./db.ts";
import { ensureSeeded } from "./seed.ts";

const PORT = Number(process.env.PORT ?? 4000);
const db = openDb();

const { sessionsCreated } = ensureSeeded(db);
if (sessionsCreated) console.log(`Scheduled ${sessionsCreated} new class sessions`);

// Keep a rolling two-week schedule while the server stays up.
setInterval(() => ensureSeeded(db), 60 * 60 * 1000).unref();

const app = createApp(db, {
  staticDir: process.env.NODE_ENV === "production" ? DEFAULT_STATIC_DIR : undefined,
});

app.listen(PORT, () => {
  console.log(`PulseFit API listening on http://localhost:${PORT}`);
});
