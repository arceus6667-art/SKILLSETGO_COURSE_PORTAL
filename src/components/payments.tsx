"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "./action-form";
import type { Domain, Order } from "@/lib/types";
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}
export function Payments({
  domains,
  started,
  orders,
  sandbox,
  initial,
}: {
  domains: Domain[];
  started: string[];
  orders: Order[];
  sandbox: boolean;
  initial?: string;
}) {
  const [domain, setDomain] = useState(
      initial && domains.some((d) => d.id === initial)
        ? initial
        : domains[0]?.id || "",
    ),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const router = useRouter();
  async function pay(product: Order["product"]) {
    setBusy(product);
    setError("");
    try {
      const { order, keyId } = await api({
        action: "order",
        domainId: domain,
        product,
      });
      if (sandbox) {
        if (
          !window.confirm(
            `Simulate a successful payment of ₹${order.amount / 100}? No money will be charged. Issued documents will be sandbox samples.`,
          )
        )
          return;
        await api({ action: "sandbox-pay", orderId: order.id });
        router.refresh();
      } else {
        await new Promise<void>((resolve, reject) => {
          if (window.Razorpay) return resolve();
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Checkout could not load"));
          document.body.append(script);
        });
        new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: "INR",
          name: "Skill Set Go EduTech",
          order_id: order.providerOrderId,
          handler: async (response: Record<string, string>) => {
            try {
              const result = await api({
                action: "verify-payment",
                orderId: order.id,
                ...response,
              });
              if (result.message) setError(result.message);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            }
          },
          theme: { color: "#102b4e" },
        }).open();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <label className="domain-select">
        Enrolled domain
        <select value={domain} onChange={(e) => setDomain(e.target.value)}>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      {!domains.length ? (
        <div className="notice">
          Enroll in a domain to see available document purchases.
        </div>
      ) : null}
      <div className="three-grid price-cards">
        {(["certificate", "bundle", "letter"] as const).map((product) => (
          <div
            className={`panel ${product === "bundle" ? "featured" : ""}`}
            key={product}
          >
            <span className="eyebrow">
              {product === "bundle"
                ? "THE COMPLETE ACHIEVEMENT"
                : "INDIVIDUAL DOCUMENT"}
            </span>
            <h2>
              {product === "bundle"
                ? "Document bundle"
                : product === "letter"
                  ? "Letter of Appreciation"
                  : "Certificate of Completion"}
            </h2>
            <div className="big-price">
              ₹
              {product === "bundle"
                ? started.includes(domain)
                  ? 500
                  : 400
                : 350}
            </div>
            <p>
              {product === "bundle"
                ? started.includes(domain)
                  ? "After your first attempt starts"
                  : "Before your first attempt starts"
                : "Per document, per domain"}
            </p>
            <ul>
              <li>
                <Check size={17} /> Issued after passing + verified payment
              </li>
              <li>
                <Check size={17} /> Secure online verification
              </li>
              <li>
                <Check size={17} /> Free performance report
              </li>
            </ul>
            <Button disabled={!domain || !!busy} onClick={() => pay(product)}>
              {busy === product
                ? "Preparing checkout…"
                : sandbox
                  ? "Simulate sandbox purchase"
                  : "Continue to secure checkout"}
            </Button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="panel spaced">
        <h2>Payment history</h2>
        {orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.id.slice(0, 8)}
                      <small>{o.mode}</small>
                    </td>
                    <td>{o.product}</td>
                    <td>₹{o.amount / 100}</td>
                    <td>
                      <span className="badge">{o.status}</span>
                    </td>
                    <td>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Your document purchases will appear here.</p>
        )}
      </section>
    </>
  );
}
