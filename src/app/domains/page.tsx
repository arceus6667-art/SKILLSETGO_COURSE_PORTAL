import { PublicNav, Footer } from "@/components/brand";
import { DomainExplorer } from "@/components/domain-explorer";
import { transact } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Domains({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; q?: string }>;
}) {
  const query = await searchParams;
  const domains = await transact((s) => s.domains.filter((d) => d.published));
  return (
    <>
      <PublicNav />
      <main className="section public-catalogue">
        <span className="eyebrow gold">EXPLORE THE POSSIBILITIES</span>
        <h1>Find your next direction.</h1>
        <p className="lead">
          Twelve disciplines. A shared ambition to keep moving forward.
        </p>
        <DomainExplorer
          domains={domains}
          portal={false}
          initial={query.q}
          initialGoal={query.goal}
        />
      </main>
      <Footer />
    </>
  );
}
