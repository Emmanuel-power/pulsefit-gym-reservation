import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category, CreateBookingInput } from "@gym/shared";
import { addDays, startOfDay } from "date-fns";
import { api } from "./client";

export const keys = {
  sessions: (day: string, category?: Category) => ["sessions", day, category ?? "all"] as const,
  myBookings: (email: string) => ["bookings", email] as const,
};

export function useSessions(day: Date, category?: Category) {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  return useQuery({
    queryKey: keys.sessions(from.toISOString(), category),
    queryFn: () => api.sessions({ from: from.toISOString(), to: to.toISOString(), category }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000, // keep spot counts fresh
  });
}

export function useMyBookings(email: string | null) {
  return useQuery({
    queryKey: keys.myBookings(email ?? ""),
    queryFn: () => api.myBookings(email!),
    enabled: Boolean(email),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => api.createBooking(input),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, email }: { code: string; email: string }) => api.cancelBooking(code, email),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
