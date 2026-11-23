"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export async function api(body: object) {
  const r = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
export function ActionButton({
  body,
  children,
  variant = "default",
  confirmText,
}: {
  body: object;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  confirmText?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="action-inline">
      <Button
        variant={variant}
        disabled={busy}
        onClick={async () => {
          if (confirmText && !window.confirm(confirmText)) return;
          setBusy(true);
          setError("");
          try {
            await api(body);
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : children}
      </Button>
      {error ? (
        <span role="alert" className="error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
export function ActionForm({
  action,
  initial = {},
  children,
  label = "Save changes",
}: {
  action: string;
  initial?: Record<string, unknown>;
  children: React.ReactNode;
  label?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form),
          body: Record<string, unknown> = { ...initial, action };
        for (const [k, v] of f.entries()) body[k] = v;
        for (const el of Array.from(form.elements)) {
          if (el instanceof HTMLInputElement && el.type === "checkbox")
            body[el.name] = el.checked;
          if (el instanceof HTMLInputElement && el.type === "number")
            body[el.name] = Number(el.value);
        }
        setBusy(true);
        try {
          if (action === "questions")
            body.questions = JSON.parse(String(body.questions));
          await api(body);
          setMessage("Saved successfully.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : label}
      </Button>
      <p role="status">{message}</p>
    </form>
  );
}
