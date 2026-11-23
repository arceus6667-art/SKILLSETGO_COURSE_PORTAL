import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav, Footer } from "@/components/brand";
import { transact } from "@/lib/store";
import { Award, BookOpen, CheckCircle2, ClipboardCheck } from "lucide-react";
import { domainVisuals } from "@/lib/discovery";
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
  const visual = domainVisuals[d.id] || {
    mark: "GO",
    caption: "Discover your next skill",
    tone: "blue",
  };
  return (
    <>
      <PublicNav />
      <main className="section domain-detail-page">
        <Link className="domain-breadcrumb" href="/domains">
          All learning paths / {d.short}
        </Link>
        <div className="domain-detail-grid">
          <div>
            <span className="eyebrow gold">{d.category}</span>
            <h1>{d.name}</h1>
            <p className="lead">{d.description}</p>
            <div className="panel">
              <h2>A foundation you can build on.</h2>
              <ul className="outcome-list">
                {d.outcomes.map((o) => (
                  <li key={o}>
                    <CheckCircle2 size={18} />
                    {o}
                  </li>
                ))}
              </ul>
              <h3>Your assessment</h3>
              <p>
                30 questions · {d.duration} minutes · Pass at 23/30 · Up to 5
                attempts
              </p>
              <p>
                Study at your own pace or proceed directly after acknowledging
                the exam policy.
              </p>
              <Link
                className="btn btn-primary"
                href={`/dashboard/course/${d.slug}`}
              >
                Explore this learning path
              </Link>
            </div>
            <div className="pathway-options">
              <article>
                <BookOpen />
                <h3>Learn at your pace</h3>
                <p>
                  {d.resources.length
                    ? `${d.resources.length} published resources to explore.`
                    : "Materials are being prepared. Check back for published resources."}
                </p>
              </article>
              <article>
                <ClipboardCheck />
                <h3>Take the direct path</h3>
                <p>
                  Already familiar with the subject? Choose direct examination
                  after accepting the policy.
                </p>
              </article>
            </div>
          </div>
          <aside className="domain-detail-aside">
            <div
              className={`domain-cover cover-${visual.tone}`}
              aria-hidden="true"
            >
              <span className="cover-caption">{visual.caption}</span>
              <span className="cover-mark">{visual.mark}</span>
              <Award size={45} />
            </div>
            <div className="domain-aside-body">
              <span className="eyebrow gold">YOUR PATH TO PROGRESS</span>
              <h2>
                Start with curiosity.
                <br />
                Build from here.
              </h2>
              <dl>
                <div>
                  <dt>Learning format</dt>
                  <dd>Self-paced</dd>
                </div>
                <div>
                  <dt>Assessment</dt>
                  <dd>30 questions</dd>
                </div>
                <div>
                  <dt>Passing score</dt>
                  <dd>23 / 30</dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>Up to 5</dd>
                </div>
              </dl>
              <Link
                className="btn btn-primary"
                href={`/dashboard/course/${d.slug}`}
              >
                Start this learning path
              </Link>
              <p>Learning & assessment are free. Documents are optional.</p>
              <Link className="domain-pricing-link" href="/pricing">
                View document pricing
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
