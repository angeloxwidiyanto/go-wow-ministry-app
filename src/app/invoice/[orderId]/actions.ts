"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

type Order = {
  id: string;
  status: string;
  total_amount: number;
  payment_proof_url: string | null;
  [key: string]: unknown;
};

export async function uploadPaymentProofAction(orderId: string, formData: FormData) {
  const file = formData.get("proof") as File;

  if (!file || file.size === 0) {
    return { error: "No file provided." };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Please upload JPG, PNG, WebP, or PDF." };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 5MB." };
  }

  // Verify order exists and is in PENDING status
  let order: Order;
  try {
    order = await apiFetch<Order>(`/api/orders/${orderId}`);
  } catch (err) {
    void err;
    return { error: "Order not found." };
  }

  if (order.status === "PAID") {
    return { error: "This order has already been confirmed." };
  }

  if (order.status === "CANCELLED") {
    return { error: "This order has been cancelled." };
  }

  // Upload to Go Backend via apiFetch
  try {
    const data = await apiFetch<{ success: boolean; url: string }>(`/api/orders/${orderId}/proof`, {
      method: "PUT",
      body: formData,
    });
    
    revalidatePath(`/invoice/${orderId}`);
    return { success: true, url: data.url };
  } catch (err) {
    console.error("Upload payment proof error:", err);
    return { error: "Failed to upload file. Please try again or contact us directly." };
  }
}
