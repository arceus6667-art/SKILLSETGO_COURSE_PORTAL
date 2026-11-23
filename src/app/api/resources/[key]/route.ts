import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { transact } from "@/lib/store";
import { readFile } from "@/lib/files";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const u = await requireUser(),
      { key } = await params;
    await transact((s) => {
      const d = s.domains.find((d) =>
        d.resources.some((r) => r.storagePath === key),
      );
      if (
        !d ||
        !d.published ||
        (u.role === "user" &&
          !s.enrollments.some((e) => e.domainId === d.id && e.userId === u.id))
      )
        throw new Error("Access denied");
    });
    return new Response(await readFile(key), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="learning-resource.pdf"',
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch {
    return new Response("Resource unavailable", { status: 404 });
  }
}
