import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sandbox } from "@/lib/store";
import { supabaseAuth } from "@/lib/auth";
import { validOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return new Response("Invalid origin", { status: 403 });
  if (sandbox) (await cookies()).delete("sg-session");
  else await (await supabaseAuth()).auth.signOut();
  return NextResponse.json({ ok: true });
}
