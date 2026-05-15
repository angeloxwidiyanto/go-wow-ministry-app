"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

type ActionResult = { success?: boolean; error?: string };

export async function addMemberAction(formData: FormData): Promise<ActionResult> {
  const payload = {
    full_name: formData.get("full_name")?.toString(),
    email: formData.get("email")?.toString() || null,
    whatsapp_number: formData.get("whatsapp_number")?.toString() || null,
    church_title: formData.get("church_title")?.toString() || null,
    gender: formData.get("gender")?.toString() || null,
    birth_date: formData.get("birth_date")?.toString() || null,
    origin_church: formData.get("origin_church")?.toString() || null,
    ministry_role: formData.get("ministry_role")?.toString() || null,
  };

  if (!payload.full_name) {
    return { error: "Full Name is required." };
  }

  try {
    await apiFetch("/api/members", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to add member.";
    if (msg.includes("already exists") || msg.includes("23505")) {
      return { error: "A member with this email or WhatsApp number already exists." };
    }
    return { error: msg };
  }

  revalidatePath("/admin/members");
  return { success: true };
}

export async function bulkAddMembersAction(
  members: Record<string, string | null>[],
  targetEventId?: string | null
): Promise<ActionResult> {
  try {
    await apiFetch("/api/members/bulk", {
      method: "POST",
      body: JSON.stringify({
        members,
        target_event_id: targetEventId ?? null,
      }),
    });
  } catch (e: unknown) {
    return {
      error: e instanceof Error ? e.message : "Bulk import failed.",
    };
  }

  revalidatePath("/admin/members");
  return { success: true };
}

export async function updateMemberAction(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id")?.toString();
  const full_name = formData.get("full_name")?.toString();

  if (!id || !full_name) {
    return { error: "ID and Full Name are required." };
  }

  const payload = {
    full_name,
    email: formData.get("email")?.toString() || null,
    whatsapp_number: formData.get("whatsapp_number")?.toString() || null,
    church_title: formData.get("church_title")?.toString() || null,
    gender: formData.get("gender")?.toString() || null,
    birth_date: formData.get("birth_date")?.toString() || null,
    origin_church: formData.get("origin_church")?.toString() || null,
    ministry_role: formData.get("ministry_role")?.toString() || null,
  };

  try {
    await apiFetch(`/api/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update member.";
    if (msg.includes("already exists") || msg.includes("23505")) {
      return { error: "A member with this email or WhatsApp number already exists." };
    }
    return { error: msg };
  }

  revalidatePath("/admin/members");
  return { success: true };
}
