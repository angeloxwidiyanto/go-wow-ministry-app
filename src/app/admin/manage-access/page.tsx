import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ManageAccessClient from "./ManageAccessClient";
import { listUsersAction } from "./actions";

export const metadata = { title: "Manage Access — WoW Admin" };

export default async function ManageAccessPage() {
  // Gate: only superadmin can view this page
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const role = user.user_metadata?.role;
  if (role !== "superadmin") redirect("/admin");

  // Fetch user list server-side
  const result = await listUsersAction();
  const users = result.users ?? [];

  return <ManageAccessClient currentUserId={user.id} users={users} />;
}
