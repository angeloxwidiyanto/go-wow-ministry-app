import { apiFetch } from "@/utils/api";
import { notFound } from "next/navigation";
import EditEventClient from "./EditEventClient";

export const revalidate = 0;

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: unknown = null;
  let parentEvents: { id: string; title: string }[] = [];

  try {
    [event, parentEvents] = await Promise.all([
      apiFetch<unknown>(`/api/events/${id}`),
      apiFetch<{ id: string; title: string; event_type: string }[]>(
        "/api/events"
      ).then((evts) => evts.filter((e) => e.event_type === "SERIES_PARENT")),
    ]);
  } catch {
    notFound();
  }

  return <EditEventClient event={event as any} parentEvents={parentEvents} />;
}
