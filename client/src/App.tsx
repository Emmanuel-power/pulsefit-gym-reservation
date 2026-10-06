import { Dumbbell } from "lucide-react";
import { NavLink, Outlet, Route, Routes } from "react-router";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { SchedulePage } from "./pages/SchedulePage";

function Layout() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? "bg-ink-800 text-white" : "text-ink-400 hover:text-white"}`;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-volt-400 text-ink-950">
              <Dumbbell className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">PulseFit</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={link}>
              Schedule
            </NavLink>
            <NavLink to="/my-bookings" className={link}>
              My bookings
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <Outlet />
      </main>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SchedulePage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="*" element={<SchedulePage />} />
      </Route>
    </Routes>
  );
}
