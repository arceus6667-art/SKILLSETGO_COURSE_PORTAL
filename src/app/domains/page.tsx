import { PublicNav, Footer } from "@/components/brand";
import { DomainGrid } from "@/components/domain-grid";
import { transact } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Domains() {
  const domains = await transact((s) => s.domains.filter((d) => d.published));
  return (
    <>
      <PublicNav />
      <main className="section">
        <span className="eyebrow gold">EXPLORE THE POSSIBILITIES</span>
        <h1>Find your next direction.</h1>
        <p className="lead">
          Twelve disciplines. A shared ambition to keep moving forward.
        </p>
        <DomainGrid domains={domains} />
      </main>
      <Footer />
    </>
  );
}
