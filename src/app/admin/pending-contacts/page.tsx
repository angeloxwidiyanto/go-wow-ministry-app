import { apiFetch } from "@/utils/api";
import PendingContactsClient from "./PendingContactsClient";

export const revalidate = 0;

export default async function PendingContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const pageSize = 50;

  let pendingAttendees: unknown[] = [];
  let totalCount = 0;

  try {
    const result = await apiFetch<{ data: unknown[]; total: number }>(
      `/api/pending-contacts?page=${page}&page_size=${pageSize}`
    );
    pendingAttendees = result.data ?? [];
    totalCount = result.total ?? 0;
  } catch (e) {
    console.error("Failed to fetch pending contacts from Go API:", e);
  }

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  return (
    <PendingContactsClient
      pendingAttendees={pendingAttendees as any[]}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}
