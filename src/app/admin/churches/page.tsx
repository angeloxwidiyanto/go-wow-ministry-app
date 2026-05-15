import { apiFetch } from "@/utils/api";
import ChurchesClient from "./ChurchesClient";

export const revalidate = 0;

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp_number: string | null;
  created_at: string;
  church_name: string | null;
  roles: string[];
};

export default async function ChurchesPage() {
  let people: Member[] = [];

  try {
    people = await apiFetch<Member[]>("/api/members");
  } catch (e) {
    console.error("Failed to fetch members for churches view:", e);
  }

  // Group people by church name (same aggregation logic as before)
  const groupedMap: Record<
    string,
    {
      churchName: string;
      count: number;
      members: Member[];
      // Go API doesn't return event history per member yet; pass empty for now
      eventHistory: { id: string; title: string; event_date: string; attendeeCount: number }[];
    }
  > = {};

  people.forEach((person) => {
    const churchName = person.church_name?.trim() || "Unknown / No Church Listed";

    if (!groupedMap[churchName]) {
      groupedMap[churchName] = {
        churchName,
        count: 0,
        members: [],
        eventHistory: [],
      };
    }

    groupedMap[churchName].count++;
    groupedMap[churchName].members.push(person);
  });

  const churches = Object.values(groupedMap).sort((a, b) => b.count - a.count);

  return <ChurchesClient churches={churches as any} />;
}
