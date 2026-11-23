import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { sandbox, transact } from "./store";
import type { User } from "./types";
export async function supabaseAuth() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot set cookies. Route handlers can. */
          }
        },
      },
    },
  );
}
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function currentUser(): Promise<User | null> {
  if (sandbox) {
    const id = (await cookies()).get("sg-session")?.value;
    if (!id) return null;
    return transact((s) => s.users.find((u) => u.id === id) || null);
  }
  const auth = await supabaseAuth();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;
  const a = data.user;
  // Authorization comes from the protected profile row, never user metadata.
  const { data: profile, error: profileError } = await auth
    .from("profiles")
    .select("id,name,email,role,country,college")
    .eq("id", a.id)
    .single();
  if (profileError)
    throw new Error(
      "Your account profile is not ready. Apply the database migration, then sign in again.",
    );
  return {
    id: a.id,
    name: profile.name,
    email: a.email || profile.email,
    role: profile.role === "admin" ? "admin" : "user",
    country: profile.country || "",
    college: profile.college || "",
  };
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Sign in to continue");
  return user;
}
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function sandboxLogin(name: string, admin: boolean) {
  if (!sandbox) throw new Error("Sandbox disabled");
  if (process.env.VERCEL) throw new Error("Sandbox is local only");
  const id = randomUUID();
  await transact((s) =>
    s.users.push({
      id,
      name,
      email: `${id}@sandbox.invalid`,
      role: admin ? "admin" : "user",
    }),
  );
  (await cookies()).set("sg-session", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 86400 * 7,
  });
}
