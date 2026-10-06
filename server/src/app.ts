import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cancelBookingSchema, createBookingSchema, emailSchema, sessionsQuerySchema } from "@gym/shared";
import type { DB } from "./db.ts";
import { errorHandler, HttpError } from "./errors.ts";
import { cancelBooking, createBooking, listBookingsByEmail } from "./services/bookings.ts";
import { getSession, listClassTypes, listSessions, listTrainers } from "./services/schedule.ts";

export interface AppOptions {
  /** Injectable clock, handy for tests. */
  now?: () => Date;
  /** Directory of the built React app to serve (production). */
  staticDir?: string;
}

export function createApp(db: DB, { now = () => new Date(), staticDir }: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  const api = express.Router();

  api.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  api.get("/classes", (_req, res) => {
    res.json(listClassTypes(db));
  });

  api.get("/trainers", (_req, res) => {
    res.json(listTrainers(db));
  });

  api.get("/sessions", (req, res) => {
    const query = sessionsQuerySchema.parse(req.query);
    res.json(listSessions(db, query));
  });

  api.get("/sessions/:id", (req, res) => {
    const session = getSession(db, Number(req.params.id));
    if (!session) throw new HttpError(404, "That class doesn't exist");
    res.json(session);
  });

  api.get("/bookings", (req, res) => {
    const email = emailSchema.parse(req.query.email);
    res.json(listBookingsByEmail(db, email));
  });

  api.post("/bookings", (req, res) => {
    const input = createBookingSchema.parse(req.body);
    res.status(201).json(createBooking(db, input, now()));
  });

  api.post("/bookings/:code/cancel", (req, res) => {
    const { email } = cancelBookingSchema.parse(req.body);
    res.json(cancelBooking(db, req.params.code, email, now()));
  });

  api.use((_req, _res, next) => next(new HttpError(404, "Not found")));

  app.use("/api", api);

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    // SPA fallback so client-side routes like /my-bookings work on refresh.
    app.get(/.*/, (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
  }

  app.use(errorHandler);
  return app;
}

export const DEFAULT_STATIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
