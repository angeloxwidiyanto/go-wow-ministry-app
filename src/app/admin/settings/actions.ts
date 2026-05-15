"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/utils/api";

export type ActionResult = {
  success: boolean;
  message: string;
  device?: string;
};

/** Save Fonnte token to app_settings via Go API */
export async function saveFonnteTokenAction(
  formData: FormData
): Promise<ActionResult> {
  const token = formData.get("fonnte_token")?.toString().trim() ?? "";

  try {
    const result = await apiFetch<{ success: boolean; message: string }>(
      "/api/settings/fonnte-token",
      {
        method: "PUT",
        body: JSON.stringify({ token }),
      }
    );
    revalidatePath("/admin/settings");
    return { success: result.success, message: result.message };
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save token.",
    };
  }
}

/** Test the currently-saved Fonnte token via Go API */
export async function testFonnteTokenAction(): Promise<ActionResult> {
  try {
    const result = await apiFetch<{
      success: boolean;
      message: string;
      device?: string;
    }>("/api/settings/fonnte-test");
    return {
      success: result.success,
      message: result.message,
      device: result.device,
    };
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Connection test failed.",
    };
  }
}
