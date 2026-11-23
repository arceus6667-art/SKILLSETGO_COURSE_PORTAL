import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep, publicAttempt } from "@/lib/engine";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await requireUser(),
      { id } = await params;
    return NextResponse.json(
      await transact((s) => {
        sweep(s, sandbox);
        const a = s.attempts.find((a) => a.id === id && a.userId === u.id);
        if (!a) throw new Error("Attempt not found");
        return publicAttempt(a);
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Attempt unavailable" }, { status: 404 });
  }
}
