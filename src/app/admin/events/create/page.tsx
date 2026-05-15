import { apiFetch } from "@/utils/api";
import CreateEventClient from "./CreateEventClient";

export const revalidate = 0;

export default async function CreateEventPage() {
  let parentEvents: { id: string; title: string }[] = [];

  try {
    const all = await apiFetch<{ id: string; title: string; event_type: string }[]>(
      "/api/events"
    );
    parentEvents = all.filter((e) => e.event_type === "SERIES_PARENT");
  } catch (e) {
    console.error("Failed to fetch parent events:", e);
  }

  return <CreateEventClient parentEvents={parentEvents} />;
}
