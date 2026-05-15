"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

type ActionResult = { success?: boolean; error?: string };

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  eventId: string
): Promise<ActionResult> {
  try {
    await apiFetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (e: unknown) {
    return {
      error: e instanceof Error ? e.message : "Failed to update order status.",
    };
  }

  revalidatePath(`/admin/events/${eventId}/attendees`);
  return { success: true };
}

export async function bulkUpdateOrderStatusAction(
  orderIds: string[],
  status: string,
  eventId: string
): Promise<ActionResult> {
  // Go API doesn't have a bulk endpoint yet; fire in parallel
  const results = await Promise.allSettled(
    orderIds.map((id) =>
      apiFetch(`/api/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    return { error: `${failed.length} of ${orderIds.length} orders failed to update.` };
  }

  revalidatePath(`/admin/events/${eventId}/attendees`);
  return { success: true };
}
