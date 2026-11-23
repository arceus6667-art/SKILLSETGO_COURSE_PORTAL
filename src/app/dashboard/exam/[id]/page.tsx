import { notFound } from "next/navigation";
import { requirePageUser as requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep, publicAttempt } from "@/lib/engine";
import { ExamRoom } from "@/components/exam";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    u = await requireUser();
  const data = await transact((s) => {
    sweep(s, sandbox);
    const a = s.attempts.find((a) => a.id === id && a.userId === u.id);
    if (!a) return null;
    return {
      initial: publicAttempt(a),
      title: s.domains.find((d) => d.id === a.domainId)!.name,
    };
  });
  if (!data) notFound();
  return <ExamRoom {...data} />;
}
