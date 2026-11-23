import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav, Footer } from "@/components/brand";
import { transact } from "@/lib/store";
export default async function Domain({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await transact((s) =>
    s.domains.find((d) => d.slug === slug && d.published),
  );
  if (!d) notFound();
  return (
    <>
      <PublicNav />
      <main className="section narrow">
        <span className="eyebrow gold">{d.category}</span>
        <h1>{d.name}</h1>
        <p className="lead">{d.description}</p>
        <div className="panel">
          <h2>A foundation you can build on.</h2>
          <ul>
            {d.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <h3>Your assessment</h3>
          <p>
            30 questions · {d.duration} minutes · Pass at 23/30 · Up to 5
            attempts
          </p>
          <p>
            Study at your own pace or proceed directly after acknowledging the
            exam policy.
          </p>
          <Link
            className="btn btn-primary"
            href={`/dashboard/course/${d.slug}`}
          >
            Explore this learning path
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
