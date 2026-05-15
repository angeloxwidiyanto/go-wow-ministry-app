import { createClient } from "@/utils/supabase/server";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isSuperAdmin = user?.user_metadata?.role === "superadmin";
  const email = user?.email ?? "";
  const displayName = email.split("@")[0] ?? "Admin";

  return (
    <SidebarClient
      isSuperAdmin={isSuperAdmin}
      displayName={displayName}
      email={email}
    />
  );
}
