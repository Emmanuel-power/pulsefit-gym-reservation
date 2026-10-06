import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Session } from "@gym/shared";
import { createApp } from "../src/app.ts";
import { openDb, type DB } from "../src/db.ts";
import { ensureSeeded } from "../src/seed.ts";

const NOW = new Date("2026-03-02T08:00:00"); // a Monday, local time

let db: DB;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = openDb(":memory:");
  ensureSeeded(db, { now: NOW, demoBookings: false });
  app = createApp(db, { now: () => NOW });
});

async function upcomingSession(): Promise<Session> {
  const from = NOW.toISOString();
  const to = new Date(NOW.getTime() + 2 * 86_400_000).toISOString();
  const res = await request(app).get("/api/sessions").query({ from, to });
  expect(res.status).toBe(200);
  return res.body[0];
}

function book(sessionId: number, n: number) {
  return request(app)
    .post("/api/bookings")
    .send({ sessionId, name: `Member ${n}`, email: `member${n}@test.dev` });
}

describe("schedule", () => {
  it("seeds a rolling two-week timetable", async () => {
    const from = NOW.toISOString();
    const to = new Date(NOW.getTime() + 14 * 86_400_000).toISOString();
    const res = await request(app).get("/api/sessions").query({ from, to });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(80);
    expect(res.body[0]).toMatchObject({ booked: 0, classType: expect.any(Object), trainer: expect.any(Object) });
  });

  it("is idempotent when re-seeded", () => {
    expect(ensureSeeded(db, { now: NOW }).sessionsCreated).toBe(0);
  });

  it("filters by category", async () => {
    const from = NOW.toISOString();
    const to = new Date(NOW.getTime() + 7 * 86_400_000).toISOString();
    const res = await request(app).get("/api/sessions").query({ from, to, category: "Yoga" });
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((s: Session) => s.classType.category === "Yoga")).toBe(true);
  });

  it("rejects bad query params", async () => {
    const res = await request(app).get("/api/sessions").query({ from: "yesterday" });
    expect(res.status).toBe(400);
  });
});

describe("bookings", () => {
  it("books a spot and returns a code", async () => {
    const session = await upcomingSession();
    const res = await book(session.id, 1);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "confirmed", email: "member1@test.dev" });
    expect(res.body.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(res.body.session.booked).toBe(1);
  });

  it("normalizes email and blocks double booking", async () => {
    const session = await upcomingSession();
    await request(app).post("/api/bookings").send({ sessionId: session.id, name: "Ada", email: "Ada@Test.dev " });
    const res = await request(app).post("/api/bookings").send({ sessionId: session.id, name: "Ada", email: "ada@test.dev" });
    expect(res.status).toBe(409);
  });

  it("validates input", async () => {
    const res = await request(app).post("/api/bookings").send({ sessionId: 1, name: "A", email: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("waitlists once full and promotes on cancellation", async () => {
    const session = await upcomingSession();
    for (let i = 0; i < session.capacity; i++) {
      expect((await book(session.id, i)).body.status).toBe("confirmed");
    }
    const w1 = await book(session.id, 100);
    const w2 = await book(session.id, 101);
    expect(w1.body).toMatchObject({ status: "waitlisted", waitlistPosition: 1 });
    expect(w2.body).toMatchObject({ status: "waitlisted", waitlistPosition: 2 });

    const first = await request(app).get("/api/bookings").query({ email: "member0@test.dev" });
    const cancel = await request(app)
      .post(`/api/bookings/${first.body[0].code}/cancel`)
      .send({ email: "member0@test.dev" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe("cancelled");

    const promoted = await request(app).get("/api/bookings").query({ email: "member100@test.dev" });
    expect(promoted.body[0].status).toBe("confirmed");
    const stillWaiting = await request(app).get("/api/bookings").query({ email: "member101@test.dev" });
    expect(stillWaiting.body[0]).toMatchObject({ status: "waitlisted", waitlistPosition: 1 });
  });

  it("requires the matching email to cancel", async () => {
    const session = await upcomingSession();
    const { body } = await book(session.id, 1);
    const res = await request(app).post(`/api/bookings/${body.code}/cancel`).send({ email: "someone@else.dev" });
    expect(res.status).toBe(404);
  });

  it("can rebook after cancelling", async () => {
    const session = await upcomingSession();
    const { body } = await book(session.id, 1);
    await request(app).post(`/api/bookings/${body.code}/cancel`).send({ email: "member1@test.dev" });
    expect((await book(session.id, 1)).status).toBe(201);
  });

  it("refuses to book a class that has started", async () => {
    const pastFrom = new Date(NOW.getTime() - 3 * 3_600_000).toISOString();
    const res = await request(app).get("/api/sessions").query({ from: pastFrom, to: NOW.toISOString() });
    const started: Session = res.body[0];
    expect(started).toBeDefined();
    const booking = await book(started.id, 1);
    expect(booking.status).toBe(400);
  });
});
