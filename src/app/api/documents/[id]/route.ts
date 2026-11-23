import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { certificateSVG, documentPDF } from "@/lib/documents";
import { readFile } from "@/lib/files";
import { renderCertificatePNG } from "@/lib/raster";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await requireUser(),
      { id } = await params;
    const data = await transact((s) => {
      const c = s.credentials.find(
        (c) => c.id === id && c.userId === u.id && !c.revoked,
      );
      if (!c) throw new Error("Unavailable");
      return {
        c,
        d: {
          ...s.domains.find((d) => d.id === c.domainId)!,
          name: c.domainName,
        },
        signaturePath: c.signaturePath,
      };
    });
    const signature = data.signaturePath
      ? await readFile(data.signaturePath)
      : undefined;
    const png = req.nextUrl.searchParams.get("format") === "png";
    const svg = req.nextUrl.searchParams.get("format") === "svg" || png;
    if (svg && data.c.kind !== "certificate")
      return new Response("Unsupported", { status: 400 });
    const bytes = svg
      ? await certificateSVG(data.c, data.d, false, signature)
      : await documentPDF(data.c, data.d, signature);
    if (png)
      return new Response(renderCertificatePNG(bytes as string), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="certificate-${id}-4k.png"`,
          "Cache-Control": "private, no-store",
        },
      });
    return new Response(
      svg ? (bytes as string) : Buffer.from(bytes as Uint8Array),
      {
        headers: {
          "Content-Type": svg ? "image/svg+xml" : "application/pdf",
          "Content-Disposition": `inline; filename="${data.c.kind}-${id}.${svg ? "svg" : "pdf"}"`,
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch {
    return new Response("Document unavailable", { status: 404 });
  }
}
