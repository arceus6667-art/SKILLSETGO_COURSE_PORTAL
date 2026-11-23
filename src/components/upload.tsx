"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export function Upload({
  domainId,
  signature = false,
}: {
  domainId?: string;
  signature?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const form = new FormData(e.currentTarget);
        if (domainId) form.set("domainId", domainId);
        form.set("kind", signature ? "signature" : "pdf");
        try {
          const r = await fetch("/api/upload", { method: "POST", body: form });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setMessage("Upload saved.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {signature ? "Original signature PNG" : "Authorized PDF resource"}
        <input
          type="file"
          name="file"
          accept={signature ? "image/png" : "application/pdf"}
          required
        />
      </label>
      {!signature ? (
        <label>
          Resource title
          <input name="title" minLength={3} maxLength={150} required />
        </label>
      ) : null}
      <p className="muted">
        {signature
          ? "Transparent PNG, up to 2 MB. Used for documents issued after this upload."
          : "PDF only, up to 10 MB. Upload only materials you have permission to distribute."}
      </p>
      <Button variant="outline" disabled={busy} type="submit">
        {busy ? "Uploading…" : "Upload file"}
      </Button>
      <p role="status">{message}</p>
    </form>
  );
}
