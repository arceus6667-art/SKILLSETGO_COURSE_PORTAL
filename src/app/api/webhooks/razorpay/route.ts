import { NextRequest, NextResponse } from "next/server";
import { transact, sandbox } from "@/lib/store";
import { signature, safeEqual, capturedPayment } from "@/lib/engine";
export async function POST(req: NextRequest) {
  if (sandbox || !process.env.RAZORPAY_WEBHOOK_SECRET)
    return new Response("Not configured", { status: 503 });
  const raw = await req.text();
  if (
    !safeEqual(
      signature(raw, process.env.RAZORPAY_WEBHOOK_SECRET),
      req.headers.get("x-razorpay-signature") || "",
    )
  )
    return new Response("Invalid signature", { status: 401 });
  try {
    const event = JSON.parse(raw);
    const eventId = req.headers.get("x-razorpay-event-id");
    if (!eventId) return new Response("Missing event ID", { status: 400 });
    await transact((s) => {
      if (s.webhooks.includes(eventId)) return;
      const p = event.payload?.payment?.entity;
      if (event.event === "payment.captured" && p) {
        const order = s.orders.find((o) => o.providerOrderId === p.order_id);
        if (
          !order ||
          p.status !== "captured" ||
          p.amount !== order.amount ||
          p.currency !== "INR"
        )
          throw new Error("Order mismatch");
        if (!Number.isFinite(event.created_at))
          throw new Error("Missing signed event timestamp");
        capturedPayment(s, order, p.id, event.created_at * 1000);
      }
      s.webhooks.push(eventId);
    });
    return NextResponse.json({ ok: true });
  } catch {
    return new Response("Webhook processing failed", { status: 400 });
  }
}
