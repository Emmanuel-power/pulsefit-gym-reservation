import type { ApiErrorBody, Booking, CreateBookingInput, Session } from "@gym/shared";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (body as ApiErrorBody | null)?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  sessions: (params: { from: string; to: string; category?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])),
    );
    return request<Session[]>(`/sessions?${qs}`);
  },
  myBookings: (email: string) => request<Booking[]>(`/bookings?${new URLSearchParams({ email })}`),
  createBooking: (input: CreateBookingInput) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(input) }),
  cancelBooking: (code: string, email: string) =>
    request<Booking>(`/bookings/${encodeURIComponent(code)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
