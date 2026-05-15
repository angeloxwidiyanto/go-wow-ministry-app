import { apiFetch } from "@/utils/api";
import EventsClient from "./EventsClient";

export const revalidate = 0;

export default async function EventsPage() {
  let events: unknown[] = [];

  try {
    events = await apiFetch<unknown[]>("/api/events");
  } catch (e) {
    console.error("Failed to fetch events from Go API:", e);
  }

  return <EventsClient initialEvents={events as any[]} />;
}
