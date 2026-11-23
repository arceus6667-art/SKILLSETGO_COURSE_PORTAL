import { notFound } from "next/navigation";
import { requirePageUser as requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep } from "@/lib/engine";
import { Course } from "@/components/course";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    u = await requireUser();
  const data = await transact((s) => {
    sweep(s, sandbox);
    const domain = s.domains.find((d) => d.slug === slug && d.published);
    if (!domain) return null;
    return {
      domain,
      enrollment: s.enrollments.find(
        (e) => e.userId === u.id && e.domainId === domain.id,
      ),
      attempts: s.attempts
        .filter((a) => a.userId === u.id && a.domainId === domain.id)
        .map(({ id, score, status }) => ({ id, score, status })),
    };
  });
  if (!data) notFound();
  return <Course {...data} sandbox={sandbox} />;
}
