"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

type CheckInResult = {
  success?: boolean;
  error?: string;
  alreadyCheckedIn?: boolean;
  attendee?: unknown;
};

export async function checkInAttendeeAction(
  attendeeId: string,
  _eventId: string  // kept for API compatibility with existing client code
): Promise<CheckInResult> {
  try {
    const result = await apiFetch<{ success: boolean; attended_at: string }>(
      `/api/attendees/${attendeeId}/checkin`,
      { method: "POST" }
    );
    return { success: result.success };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to check in attendee.";
    if (msg.includes("already")) {
      return { error: msg, alreadyCheckedIn: true };
    }
    return { error: msg };
  }
}

export async function searchAttendeesAction(
  _eventId: string,
  query: string
): Promise<{ success?: boolean; error?: string; data?: unknown[] }> {
  // Lookup by registration number (Go API public endpoint)
  try {
    const attendee = await apiFetch<unknown>(
      `/api/attendees/lookup?reg=${encodeURIComponent(query)}`
    );
    return { success: true, data: [attendee] };
  } catch {
    // Fall back to listing attendees for the event and filtering client-side
    try {
      const all = await apiFetch<unknown[]>(`/api/attendees?event_id=${_eventId}`);
      const q = query.toLowerCase();
      const filtered = (all as any[]).filter(
        (a) =>
          a.registration_number?.toLowerCase().includes(q) ||
          a.attendee_name?.toLowerCase().includes(q)
      );
      return { success: true, data: filtered };
    } catch (e2: unknown) {
      return {
        error: e2 instanceof Error ? e2.message : "Failed to search attendees.",
      };
    }
  }
}
