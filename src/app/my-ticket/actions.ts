"use server";

import { apiFetch } from "@/utils/api";

export async function lookupTicketAction(query: string) {
  const q = query.trim();

  if (!q || q.length < 3) {
    return { error: "Please enter at least 3 characters." };
  }

  let data;
  try {
    data = await apiFetch(`/api/orders/search?q=${encodeURIComponent(q)}`, {
      next: { revalidate: 0 }
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (!data || data.length === 0) {
    return { error: "No registrations found. Please check your email or WhatsApp number." };
  }

  return { success: true, orders: data };
}
