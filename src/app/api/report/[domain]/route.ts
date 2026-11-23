import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep } from "@/lib/engine";
import { reportPDF } from "@/lib/documents";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    const u = await requireUser(),
      { domain } = await params;
    const data = await transact((s) => {
      sweep(s, sandbox);
      const d = s.domains.find((d) => d.id === domain),
        a = s.attempts.filter(
          (a) =>
            a.domainId === domain &&
            a.userId === u.id &&
            a.status === "submitted",
        );
      if (!d || !a.length) throw new Error("No results yet");
      return { d, a };
    });
    return new Response(Buffer.from(await reportPDF(data.a, data.d, u.name)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="performance-report.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Report unavailable", { status: 404 });
  }
}
