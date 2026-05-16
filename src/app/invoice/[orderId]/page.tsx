import { notFound } from "next/navigation";
import InvoiceClient from "./InvoiceClient";
import PaymentProofUpload from "./PaymentProofUpload";
import { apiFetch } from "@/utils/api";

export const revalidate = 0;

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;

  // Fetch the Order along with its related Event and Attendees from Go API
  let order;
  try {
    order = await apiFetch(`/api/orders/${resolvedParams.orderId}`, {
      next: { revalidate: 0 }
    });
  } catch (error) {
    console.error("INVOICE PAGE ERROR:", error);
    notFound();
  }

  if (!order) {
    notFound();
  }

  const isPending = order.status === "PENDING";

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center p-4 sm:p-10 font-body">
      <InvoiceClient order={order} />
      {isPending && (
        <div className="w-full max-w-2xl mt-4">
          <PaymentProofUpload
            orderId={order.id}
            totalAmount={order.total_amount}
            existingProofUrl={order.payment_proof_url}
          />
        </div>
      )}
    </div>
  );
}
