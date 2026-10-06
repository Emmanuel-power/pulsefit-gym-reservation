# PulseFit — Gym Class Reservations

A full-stack gym class booking app written end-to-end in TypeScript. Members browse a rolling two-week class
schedule, reserve a spot with just their name and email (no sign-up), join a waitlist when a class is full,
and manage or cancel bookings with their booking code.

## Features

- **Two-week schedule.** Day picker, category filters, morning/afternoon/evening grouping and live spot counts (refreshed every 30s).
- **No-account booking.** Book with a name and email and get a 6-character booking code. Your details are remembered in this browser.
- **Capacity and waitlist.** Full classes take a waitlist. When someone cancels, the first person waiting is promoted automatically.
- **Safe under concurrency.** Bookings run in `BEGIN IMMEDIATE` SQLite transactions, so a class can't be oversold. A partial unique index blocks double-booking.
- **My bookings.** Look up by email to see upcoming and past classes, your waitlist position and simple stats, and to cancel or leave a waitlist.
- **Shared validation.** The same Zod schemas validate forms in the browser and requests on the server.
- **Responsive and accessible.** Mobile-first layout, keyboard-friendly native `<dialog>`, ARIA progress bars and tabs.

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Frontend | React 19, Vite, Tailwind CSS v4, TanStack Query, React Router, date-fns, lucide-react, sonner |
| Backend  | Node 22, Express 5, better-sqlite3, Zod |
| Shared   | `@gym/shared`: API types and Zod schemas (npm workspace) |
| Testing  | Vitest + Supertest (API integration tests against in-memory SQLite) |

## Getting started

```bash
cd gym-reservation
npm install
npm run dev        # API on :4000, web app on http://localhost:5173
```

The database (`server/data/gym.db`) is created and seeded automatically on first run, with six trainers,
twelve class types, a weekly timetable and some demo bookings so the schedule looks lived-in. The schedule
extends itself so there are always 14 days of classes.

| Script              | What it does |
| ------------------- | ------------ |
| `npm run dev`       | Run API + web app with hot reload |
| `npm test`          | API integration tests |
| `npm run typecheck` | Type-check server and client |
| `npm run build`     | Production build of the web app |
| `npm start`         | Serve API + built web app from one process on `PORT` (default 4000) |
| `npm run seed`      | Reset the database to a fresh schedule |

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET  | `/api/sessions?from=ISO&to=ISO[&category=Yoga]` | Classes in a time range, with booked/waitlist counts |
| GET  | `/api/sessions/:id` | A single class session |
| GET  | `/api/classes` · `/api/trainers` | Reference data |
| POST | `/api/bookings` `{ sessionId, name, email }` | Book, or join the waitlist if full. `409` if already booked |
| GET  | `/api/bookings?email=` | A member's bookings |
| POST | `/api/bookings/:code/cancel` `{ email }` | Cancel a booking and promote the waitlist |

## Project structure

```
gym-reservation/
├── shared/src/index.ts        # API types + Zod schemas used by both sides
├── server/
│   ├── src/app.ts             # Express app factory (routes, static hosting)
│   ├── src/db.ts              # SQLite schema & connection
│   ├── src/seed.ts            # Trainers, classes, weekly timetable → rolling schedule
│   ├── src/services/          # Booking + schedule logic
│   └── test/api.test.ts
└── client/src/
    ├── api/                   # fetch client + TanStack Query hooks
    ├── components/            # SessionCard, BookingDialog, DayPicker, …
    ├── pages/                 # Schedule, My bookings
    └── lib/                   # formatting, remembered identity
```

## Notes

There are no accounts by design, so anyone who knows an email can see that person's bookings. Cancelling
requires both the booking code and the matching email. For a real deployment you'd add a magic-link email
check before showing or changing bookings.
