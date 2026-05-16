"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

export type ActionResult = { success: boolean; message: string };

/** Update an order's status — Go backend handles WhatsApp notification async */
export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<ActionResult> {
  try {
    await apiFetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update order.",
    };
  }

  revalidatePath("/admin", "layout");
  return { success: true, message: `Order marked as ${status}.` };
}
