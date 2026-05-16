"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult = { success: boolean; message: string };

// ─── Create Event ──────────────────────────────────────────────────────────────

export async function createEventAction(
  formData: FormData
): Promise<ActionResult> {
  const payload = buildEventPayload(formData);

  try {
    await apiFetch("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    return { success: false, message: errorMessage(e) };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

// ─── Update Event ──────────────────────────────────────────────────────────────

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<ActionResult> {
  const payload = buildEventPayload(formData);

  try {
    await apiFetch(`/api/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    return { success: false, message: errorMessage(e) };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  redirect("/admin/events");
}

// ─── Delete Event ──────────────────────────────────────────────────────────────

export async function deleteEventAction(
  eventId: string
): Promise<ActionResult> {
  try {
    await apiFetch(`/api/events/${eventId}`, { method: "DELETE" });
  } catch (e: unknown) {
    return { success: false, message: errorMessage(e) };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

// ─── Toggle Publish ────────────────────────────────────────────────────────────

export async function toggleEventPublishAction(
  eventId: string,
  currentlyPublished: boolean
): Promise<ActionResult> {
  try {
    await apiFetch(`/api/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify({ is_published: !currentlyPublished }),
    });
  } catch (e: unknown) {
    return { success: false, message: errorMessage(e) };
  }

  revalidatePath("/admin/events");
  return { success: true, message: currentlyPublished ? "Event unpublished." : "Event published!" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts any date string (datetime-local "YYYY-MM-DDTHH:mm" or already-ISO)
 * into a full RFC 3339 string the Go backend can parse.  Returns null when empty.
 */
function toRFC3339(value?: string | null): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString(); // e.g. "2026-05-16T07:30:00.000Z"
  } catch {
    return null;
  }
}

function buildEventPayload(formData: FormData): Record<string, unknown> {
  const parseJSON = (key: string, fallback: unknown = []) => {
    try {
      return JSON.parse(formData.get(key)?.toString() ?? "");
    } catch {
      return fallback;
    }
  };

  // Convert tier dates to RFC3339 so the Go backend can parse them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTiers: any[] = parseJSON("ticket_tiers", []);
  const tiers = rawTiers.map((tier) => ({
    ...tier,
    start_date: toRFC3339(tier.start_date),
    end_date: toRFC3339(tier.end_date),
  }));

  return {
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString() || null,
    slug: formData.get("slug")?.toString(),
    // Convert datetime-local → RFC3339 for the required event_date field
    event_date: toRFC3339(formData.get("event_date")?.toString()) ?? formData.get("event_date")?.toString(),
    event_end_date: toRFC3339(formData.get("event_end_date")?.toString()),
    location: formData.get("location")?.toString() || null,
    meeting_url: formData.get("meeting_url")?.toString() || null,
    is_published: formData.get("is_published") === "on",
    event_type: formData.get("event_type")?.toString() || "SINGLE",
    parent_event_id: formData.get("parent_event_id")?.toString() || null,
    theme_color: formData.get("theme_color")?.toString() || "purple",
    cover_image_url: formData.get("cover_image_url")?.toString() || null,
    content_blocks: parseJSON("content_blocks", []),
    vouchers: parseJSON("vouchers", []),
    ticket_tiers: tiers,
  };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unexpected error occurred.";
}
