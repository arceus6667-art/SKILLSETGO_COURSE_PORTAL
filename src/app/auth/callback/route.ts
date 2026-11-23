import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth, currentUser } from "@/lib/auth";
import { cookies } from "next/headers";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const auth = await supabaseAuth();
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (!error) {
      const portal = (await cookies()).get("sg-portal")?.value;
      (await cookies()).delete("sg-portal");
      const user = await currentUser();
      return NextResponse.redirect(
        new URL(
          portal === "admin" && user?.role === "admin"
            ? "/admin"
            : "/dashboard",
          process.env.NEXT_PUBLIC_APP_URL || req.url,
        ),
      );
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", req.url));
}
