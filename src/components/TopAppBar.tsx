import Link from "next/link";
import { apiFetch } from "@/utils/api";
import NotificationBell, { NotificationItem } from "./NotificationBell";

async function getNotifications(): Promise<NotificationItem[]> {
  try {
    // Fetch PENDING orders from the Go API
    // The API automatically sorts by created_at DESC
    const orders = await apiFetch<any[]>("/api/orders?status=PENDING");
    if (!orders || orders.length === 0) return [];

    const now = Date.now();

    function timeAgo(dateStr: string) {
      const diff = now - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    }

    const notifications: NotificationItem[] = [];

    // The API already limits, but we can slice to 20 just in case
    for (const order of orders.slice(0, 20)) {
      const eventTitle = order.event_title || "Unknown Event";

      if (order.payment_proof_url) {
        // Proof uploaded → admin needs to confirm
        notifications.push({
          id: `proof-${order.id}`,
          type: "proof_uploaded",
          title: "Payment proof uploaded",
          subtitle: `${order.pic_name} · ${eventTitle}`,
          href: "/admin/orders",
          time: timeAgo(order.created_at),
        });
      } else {
        // New order, no proof yet
        notifications.push({
          id: `order-${order.id}`,
          type: "new_order",
          title: "New registration pending",
          subtitle: `${order.pic_name} · ${eventTitle}`,
          href: "/admin/orders",
          time: timeAgo(order.created_at),
        });
      }
    }

    // Sort: proof_uploaded first (higher priority)
    notifications.sort((a, b) =>
      a.type === "proof_uploaded" && b.type !== "proof_uploaded" ? -1 : 1
    );

    return notifications;
  } catch {
    return [];
  }
}

export default async function TopAppBar() {
  const notifications = await getNotifications();

  return (
    <header className="fixed top-0 right-0 left-72 z-40 bg-white/80 backdrop-blur-xl h-20 px-8 flex justify-between items-center shadow-[0px_10px_30px_-5px_rgba(147,11,212,0.05)]">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none"
            placeholder="Search members or requests..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Live notification bell */}
          <NotificationBell items={notifications} />

          <Link
            href="/admin/settings"
            className="p-2 text-zinc-500 hover:bg-purple-50 rounded-full transition-colors"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>

        <div className="h-10 w-[1px] bg-zinc-100" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-900">Minister Sarah</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
            <img
              alt="Minister Profile"
              className="w-full h-full object-cover"
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
