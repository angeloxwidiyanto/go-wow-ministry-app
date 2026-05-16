"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

type ActionResult = { success?: boolean; error?: string };
type PersonResult = { id: string; full_name: string; email: string | null; whatsapp_number: string | null };
type PeopleResult = { data?: PersonResult[]; error?: string };

export async function createNewPersonAction(attendee: Record<string, unknown>): Promise<ActionResult> {
  try {
    await apiFetch("/api/pending-contacts/create-person", {
      method: "POST",
      body: JSON.stringify(attendee),
    });
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to create person." };
  }

  revalidatePath("/admin/pending-contacts");
  revalidatePath("/admin/members");
  return { success: true };
}

export async function mergePersonAction(
  attendeeId: string,
  personId: string
): Promise<ActionResult> {
  try {
    await apiFetch("/api/pending-contacts/merge", {
      method: "POST",
      body: JSON.stringify({ attendee_id: attendeeId, person_id: personId }),
    });
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to merge person." };
  }

  revalidatePath("/admin/pending-contacts");
  return { success: true };
}

export async function searchPeopleAction(query: string): Promise<PeopleResult> {
  if (!query || query.length < 2) return { data: [] };
  try {
    const data = await apiFetch<PersonResult[]>(
      `/api/members?search=${encodeURIComponent(query)}&limit=10`
    );
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to search people." };
  }
}

export async function bulkCreateNewPersonsAction(
  attendees: Record<string, unknown>[]
): Promise<ActionResult> {
  try {
    await apiFetch("/api/pending-contacts/bulk-create", {
      method: "POST",
      body: JSON.stringify({ attendees }),
    });
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Bulk create failed." };
  }

  revalidatePath("/admin/pending-contacts");
  revalidatePath("/admin/members");
  return { success: true };
}
