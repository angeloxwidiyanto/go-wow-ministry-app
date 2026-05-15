import { apiFetch } from "@/utils/api";
import { notFound } from "next/navigation";
import EventAttendeesClient from "./EventAttendeesClient";

export const revalidate = 0;

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: { id: string; title: string } | null = null;
  let attendees: unknown[] = [];

  try {
    event = await apiFetch<{ id: string; title: string }>(`/api/events/${id}`);
  } catch {
    notFound();
  }

  try {
    attendees = await apiFetch<unknown[]>(`/api/attendees?event_id=${id}`);
  } catch (e) {
    console.error("Failed to fetch attendees:", e);
  }

  return (
    <EventAttendeesClient
      eventTitle={event!.title}
      attendees={attendees as any[]}
    />
  );
}
