import { apiFetch } from "@/utils/api";
import { notFound } from "next/navigation";
import CheckInClient from "./CheckInClient";

export const revalidate = 0;

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: { id: string; title: string } | null = null;
  let attendees: { attended_at: string | null }[] = [];

  try {
    event = await apiFetch<{ id: string; title: string }>(`/api/events/${id}`);
  } catch {
    notFound();
  }

  try {
    attendees = await apiFetch<{ attended_at: string | null }[]>(
      `/api/attendees?event_id=${id}`
    );
  } catch (e) {
    console.error("Failed to fetch attendees for check-in stats:", e);
  }

  const totalCount = attendees.length;
  const checkedInCount = attendees.filter((a) => a.attended_at !== null).length;

  return (
    <CheckInClient
      event={event!}
      initialTotal={totalCount}
      initialCheckedIn={checkedInCount}
    />
  );
}
