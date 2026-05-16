"use server";

import { createAdminClient } from "@/utils/supabase/admin";
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
  const supabase = createAdminClient();
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

  // Upload to Supabase Storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${orderId}-${Date.now()}.${fileExt}`;
  const filePath = `payment-proofs/${fileName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs") // Bucket name
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { error: "Failed to upload file. Please try again." };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("payment-proofs")
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl;

  // Update the order with proof URL via Go API
  try {
    await apiFetch(`/api/orders/${orderId}/proof`, {
      method: "PUT",
      body: JSON.stringify({ payment_proof_url: publicUrl }),
    });
  } catch (err) {
    return { error: "Failed to save payment proof. Please contact us directly." };
  }

  revalidatePath(`/invoice/${orderId}`);
  return { success: true, url: publicUrl };
}
