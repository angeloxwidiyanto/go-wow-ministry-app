import { apiFetch } from "@/utils/api";
import OrdersClient from "./OrdersClient";

export const revalidate = 0;

type GoOrder = {
  id: string;
  event_id: string;
  pic_name: string;
  pic_email: string;
  pic_whatsapp: string;
  total_tickets: number;
  total_amount: number;
  applied_voucher: string | null;
  discount_amount: number;
  payment_method: string | null;
  payment_proof_url: string | null;
  status: "PENDING" | "PAID" | "CANCELLED";
  created_at: string;
  // Go joins event title directly
  event_title: string | null;
};

export default async function OrdersPage() {
  let rawOrders: GoOrder[] = [];

  try {
    rawOrders = await apiFetch<GoOrder[]>("/api/orders");
  } catch (e) {
    console.error("Failed to fetch orders from Go API:", e);
  }

  // Transform Go flat response → shape OrdersClient expects (events nested object)
  const orders = rawOrders.map((o) => ({
    ...o,
    events: o.event_id
      ? {
          id: o.event_id,
          title: o.event_title ?? "Unknown Event",
          slug: "",
          event_date: o.created_at, // Go API doesn't join event_date yet; uses created_at as fallback
        }
      : null,
  }));

  return <OrdersClient orders={orders} />;
}
