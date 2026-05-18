/**
 * api.ts — Shared fetch client for the Go backend.
 *
 * All Next.js Server Components and Server Actions import from here.
 * In Docker, INTERNAL_API_URL points directly to the Go container (http://backend:8080)
 * so requests never leave the internal network. Falls back to localhost:8080 for local dev.
 */

import { createClient } from "@/utils/supabase/server";

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Server-side authenticated fetch.
 * Forwards the Supabase session cookie to the Go API so RequireAuth middleware can validate it.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} failed [${res.status}]: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Client-side fetch helper (browser context).
 * Relies on the Supabase token stored in localStorage by the Supabase client SDK.
 * Pass the token explicitly from `useSession()`.
 */
export function apiUrl(path: string): string {
  const base =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
      : API_BASE;
  return `${base}${path}`;
}
