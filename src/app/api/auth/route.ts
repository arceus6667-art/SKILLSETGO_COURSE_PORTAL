import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sandboxLogin, supabaseAuth } from "@/lib/auth";
import { sandbox } from "@/lib/store";
import { validOrigin } from "@/lib/security";
import { cookies } from "next/headers";
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req))
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const body = await req.json();
    (await cookies()).set(
      "sg-portal",
      body.portal === "admin" ? "admin" : "user",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 600,
      },
    );
    if (sandbox) {
      const v = z
        .object({
          name: z.string().trim().min(2).max(80),
          admin: z.boolean().optional(),
        })
        .parse(body);
      await sandboxLogin(v.name, !!v.admin);
      return NextResponse.json({ ok: true });
    }
    const auth = await supabaseAuth();
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
    if (body.google) {
      if (process.env.GOOGLE_AUTH_ENABLED !== "true")
        throw new Error(
          "Google sign-in is not available yet. Please use your email sign-in link.",
        );
      const { data, error } = await auth.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      return NextResponse.json({ url: data.url });
    }
    const email = z.email().parse(body.email);
    const { error } = await auth.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return NextResponse.json({
      message: "Check your email for your secure sign-in link.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign in failed" },
      { status: 400 },
    );
  }
}
