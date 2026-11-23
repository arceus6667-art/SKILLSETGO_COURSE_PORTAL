import { NextRequest } from "next/server";
import { certificateSVG } from "@/lib/documents";
import { domains } from "@/lib/catalog";
import { renderCertificatePNG } from "@/lib/raster";
export async function GET(req: NextRequest) {
  const svg = await certificateSVG(
    {
      id: "TEMPLATE-PREVIEW",
      userId: "preview",
      domainId: "python",
      domainName: "Python Development",
      kind: "certificate",
      issuedAt: new Date().toISOString(),
      name: "Your Name Here",
      score: 23,
      revoked: false,
      mode: "sandbox",
    },
    domains.find((d) => d.id === "python")!,
    true,
  );
  if (req.nextUrl.searchParams.get("format") === "png")
    return new Response(renderCertificatePNG(svg), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition":
          'attachment; filename="skill-set-go-certificate-4k.png"',
        "Cache-Control": "no-store",
      },
    });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}
