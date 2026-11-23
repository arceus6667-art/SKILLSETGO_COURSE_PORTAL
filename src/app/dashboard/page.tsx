import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Flame,
  Code2,
  Clock3,
} from "lucide-react";
import { requirePageUser as requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep } from "@/lib/engine";
import { DomainGrid } from "@/components/domain-grid";
export default async function Dashboard() {
  const user = await requireUser();
  const data = await transact((s) => {
    sweep(s, sandbox);
    return {
      enrollments: s.enrollments.filter((e) => e.userId === user.id),
      attempts: s.attempts.filter((a) => a.userId === user.id),
      credentials: s.credentials.filter(
        (c) => c.userId === user.id && !c.revoked,
      ),
      domains: s.domains.filter((d) => d.published),
    };
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">YOUR NEXT CHAPTER</span>
          <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
          <p>A little curiosity. A new skill. A step closer to your goals.</p>
        </div>
        <Link className="btn btn-outline" href="/dashboard/domains">
          Explore domains
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [BookOpen, data.enrollments.length, "Learning paths"],
          [
            ClipboardCheck,
            data.attempts.filter((a) => a.status === "submitted").length,
            "Assessments completed",
          ],
          [Award, data.credentials.length, "Credentials earned"],
          [
            Flame,
            data.attempts.filter((a) => (a.score || 0) >= 23).length,
            "Domains passed",
          ],
        ].map(([Icon, n, label]) => {
          const I = Icon as typeof BookOpen;
          return (
            <div className="stat" key={String(label)}>
              <I size={21} />
              <strong>{String(n)}</strong>
              <span>{String(label)}</span>
            </div>
          );
        })}
      </div>
      <section className="continue-banner">
        <div>
          <span className="pill">YOUR LEARNING JOURNEY</span>
          <h2>
            {data.enrollments.length
              ? "Pick up your next milestone."
              : "Make room for what comes next."}
          </h2>
          <p>
            {data.enrollments.length
              ? "Pick up where you left off. Your resources and progress are right here."
              : "Find a domain that sparks your curiosity. Your learning journey starts with a choice."}
          </p>
          <Link
            className="btn btn-gold"
            href={
              data.enrollments.length
                ? "/dashboard/my-learning"
                : "/dashboard/domains"
            }
          >
            {data.enrollments.length
              ? "Continue learning"
              : "Choose your first domain"}
          </Link>
        </div>
        <div className="banner-symbol">
          <GraduationMark />
        </div>
      </section>
      <div className="two-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>My learning paths</h2>
            <Link href="/dashboard/my-learning">View all</Link>
          </div>
          {data.enrollments.length ? (
            data.enrollments.map((e) => {
              const d = data.domains.find((d) => d.id === e.domainId);
              if (!d) return null;
              return (
                <Link
                  className="learning-row"
                  href={`/dashboard/course/${d.slug}`}
                  key={e.id}
                >
                  <div className="domain-icon">
                    <Code2 />
                  </div>
                  <div>
                    <strong>{d.name}</strong>
                    <p>
                      {e.completed.length} of {d.resources.length} resources
                      acknowledged
                    </p>
                    <div className="progress-bar">
                      <span
                        style={{
                          width: `${d.resources.length ? (e.completed.length / d.resources.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Clock3 size={18} />
                </Link>
              );
            })
          ) : (
            <div className="empty">
              <BookOpen />
              <h3>A blank page. A world of possibility.</h3>
              <p>
                Enroll in your first domain to see your learning journey here.
              </p>
            </div>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow gold">KNOW BEFORE YOU GO</span>
          <h2>Your assessment, explained.</h2>
          <div className="rule-row">
            <strong>30</strong>
            <span>questions to demonstrate your knowledge</span>
          </div>
          <div className="rule-row">
            <strong>23</strong>
            <span>correct answers to pass</span>
          </div>
          <div className="rule-row">
            <strong>5</strong>
            <span>attempts to find your stride</span>
          </div>
          <Link href="/exam-policy">Read the examination policy</Link>
        </section>
      </div>
      <section className="spaced">
        <div className="panel-heading">
          <div>
            <span className="eyebrow gold">KEEP YOUR CURIOSITY MOVING</span>
            <h2>Discover your next possibility.</h2>
          </div>
          <Link href="/dashboard/domains">All domains</Link>
        </div>
        <DomainGrid domains={data.domains.slice(0, 3)} portal />
      </section>
    </>
  );
}
function GraduationMark() {
  return (
    <div>
      <Award size={100} strokeWidth={1} />
      <span>LEARN. BUILD. PROVE.</span>
    </div>
  );
}
