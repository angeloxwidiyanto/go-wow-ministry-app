import { apiFetch } from "@/utils/api";
import MembersClient from "./MembersClient";

export const revalidate = 0;

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp_number: string | null;
  church_title: string | null;
  gender: string | null;
  birth_date: string | null;
  created_at: string;
  church_name: string | null;
  roles: string[];
};

export default async function MembersPage() {
  let members: Member[] = [];
  let events: { id: string; title: string }[] = [];

  // Collect church names and role names for autocomplete from existing members
  const existingChurches: string[] = [];
  const existingRoles: string[] = [];

  try {
    [members, events] = await Promise.all([
      apiFetch<Member[]>("/api/members"),
      apiFetch<{ id: string; title: string }[]>("/api/events"),
    ]);

    // Derive autocomplete lists from member data (avoid extra round-trips)
    const churchSet = new Set<string>();
    const roleSet = new Set<string>();
    members.forEach((m) => {
      if (m.church_name) churchSet.add(m.church_name);
      m.roles?.forEach((r) => roleSet.add(r));
    });
    existingChurches.push(...Array.from(churchSet).sort());
    existingRoles.push(...Array.from(roleSet).sort());
  } catch (e) {
    console.error("Failed to fetch members from Go API:", e);
  }

  return (
    <MembersClient
      initialMembers={members as any}
      existingChurches={existingChurches}
      existingRoles={existingRoles}
      existingEvents={events}
    />
  );
}
