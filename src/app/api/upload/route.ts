import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { permit, audit } from "@/lib/engine";
import { writeFile } from "@/lib/files";
import { validOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req)) throw new Error("Invalid origin");
    const u = await requireUser(),
      form = await req.formData(),
      signature = form.get("kind") === "signature";
    permit(u, signature ? "settings" : "content");
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > (signature ? 2 : 10) * 1024 * 1024
    )
      throw new Error("Invalid file or file size exceeds limit");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      signature
        ? !bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.subarray(0, 5).toString() !== "%PDF-"
    )
      throw new Error(
        signature
          ? "Only PNG signatures are accepted"
          : "Only PDF files are accepted",
      );
    const domainId = String(form.get("domainId") || ""),
      title = String(form.get("title") || "");
    if (!signature && (title.length < 3 || title.length > 150))
      throw new Error("Provide a resource title");
    await transact((s) => {
      if (!signature && !s.domains.some((d) => d.id === domainId))
        throw new Error("Domain not found");
    });
    const key = `${randomUUID()}.${signature ? "png" : "pdf"}`;
    await writeFile(key, bytes, signature ? "image/png" : "application/pdf");
    await transact((s) => {
      if (signature) s.settings.signaturePath = key;
      else
        s.domains
          .find((d) => d.id === domainId)!
          .resources.push({
            id: randomUUID(),
            title,
            kind: "pdf",
            url: `/api/resources/${key}`,
            storagePath: key,
          });
      audit(
        s,
        u.id,
        signature ? "signature.uploaded" : "resource.uploaded",
        key,
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
