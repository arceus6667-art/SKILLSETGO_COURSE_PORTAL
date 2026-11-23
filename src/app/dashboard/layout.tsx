import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { sandbox } from "@/lib/store";
import { PortalShell } from "@/components/portal-shell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <PortalShell user={user} sandbox={sandbox}>
      {children}
    </PortalShell>
  );
}
