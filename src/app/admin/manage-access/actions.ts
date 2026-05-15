"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { apiFetch } from "@/utils/api";

/**
 * List all auth users (superadmin only).
 * NOTE: Supabase Auth Admin API is still called directly here because user
 * management (invite/delete/role-change) operates on Supabase Auth records,
 * not on our Go application database. This is intentional — Go owns the
 * business data layer, Supabase Auth owns identity.
 */
export async function listUsersAction() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return { error: error.message };
  return { users: data.users };
}

export async function inviteUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "admin";

  if (!email) return { error: "Email is required." };

  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
  });

  if (error) {
    if (error.message.includes("already been registered"))
      return { error: "This email is already registered." };
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  });
  if (error) return { error: error.message };
  return { success: true };
}
