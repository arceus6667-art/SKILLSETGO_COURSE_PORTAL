"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export function LoginForm({
  sandbox,
  googleReady = false,
  portal = "user",
}: {
  sandbox: boolean;
  googleReady?: boolean;
  portal?: "user" | "admin";
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function login(body: object) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, portal }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.url) window.location.href = d.url;
      else if (sandbox) {
        router.push(portal === "admin" ? "/admin" : "/dashboard");
        router.refresh();
      } else setMessage(d.message);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void login(
            sandbox
              ? { name: f.get("name"), admin: portal === "admin" }
              : { email: f.get("email") },
          );
        }}
      >
        {sandbox ? (
          <>
            <label>
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Your full name"
              />
            </label>
            <p className="muted">
              Local test accounts only. No password or real email is required.
              Keep this sandbox on your computer.
            </p>
          </>
        ) : (
          <label>
            Email address
            <input
              name="email"
              required
              type="email"
              placeholder="you@example.com"
            />
          </label>
        )}
        <Button disabled={busy} type="submit">
          {busy
            ? "Please wait…"
            : sandbox
              ? "Enter local sandbox"
              : "Send secure sign-in link"}
        </Button>
      </form>
      {
        <Button
          variant="outline"
          disabled={busy || sandbox || !googleReady}
          onClick={() => login({ google: true })}
        >
          Continue with Google
        </Button>
      }
      {!sandbox && !googleReady ? (
        <p className="muted">
          Email sign-in is available while Google sign-in is being enabled.
        </p>
      ) : null}
      <p role="status">{message}</p>
    </>
  );
}
