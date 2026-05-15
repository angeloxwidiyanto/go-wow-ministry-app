/**
 * Fonnte WhatsApp API utility
 * Docs: https://fonnte.com/docs
 *
 * Fonnte uses a single API token per device.
 * All messages are sent as WhatsApp messages to the target number.
 */

const FONNTE_API = "https://api.fonnte.com/send";

/**
 * Normalize an Indonesian phone number to Fonnte's expected format: 628xxxxxxxxx
 *
 * Handles:
 *   "08123456789"   → "628123456789"
 *   "8123456789"    → "628123456789"
 *   "+628123456789" → "628123456789"
 *   "628123456789"  → "628123456789"
 *   "0812-3456-789" → "628123456789"  (strips separators)
 */
function normalizePhone(raw: string): string {
  // Strip everything that isn't a digit or leading +
  const digits = raw.replace(/[^\d]/g, "");

  if (digits.startsWith("62")) return digits;          // already has country code
  if (digits.startsWith("0")) return "62" + digits.slice(1); // 0xxx → 62xxx
  if (digits.startsWith("8")) return "62" + digits;   // 8xxx → 628xxx

  // Fallback: return as-is (Fonnte will reject invalid numbers server-side)
  return digits;
}

/**
 * Retrieve the saved Fonnte token from app_settings.
 * Returns null if not configured.
 */
export async function getFonnteToken(): Promise<string | null> {
  // Dynamic import to avoid pulling Supabase into edge runtime contexts
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "fonnte_token")
    .single();

  return data?.value || null;
}


export async function sendWhatsApp(
  token: string,
  target: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  if (!token) {
    return { success: false, message: "Fonnte token is not configured." };
  }

  // Normalize number to Indonesian E.164-style (without the +)
  const normalized = normalizePhone(target);

  try {
    const res = await fetch(FONNTE_API, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: normalized,
        message,
        countryCode: "62",
      }),
    });

    const data = await res.json();

    if (data.status === true) {
      return { success: true, message: "Message sent successfully." };
    } else {
      return { success: false, message: data.reason || "Failed to send message." };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Network error." };
  }
}

/**
 * Test a Fonnte token by calling the device status endpoint.
 */
export async function testFonnteToken(
  token: string
): Promise<{ success: boolean; message: string; device?: string }> {
  if (!token) {
    return { success: false, message: "Token is empty." };
  }

  try {
    const res = await fetch("https://api.fonnte.com/device", {
      method: "GET",
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (data.status === true) {
      return {
        success: true,
        message: "Token is valid. Device is connected.",
        device: data.name || data.device || "Unknown device",
      };
    } else {
      return {
        success: false,
        message: data.reason || "Token is invalid or device is disconnected.",
      };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Network error." };
  }
}
