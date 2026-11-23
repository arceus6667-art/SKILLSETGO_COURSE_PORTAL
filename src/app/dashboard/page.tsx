import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Flame,
  Code2,
  Clock3,
  CheckCircle2,
  Circle,
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
  const passed = new Set(
    data.attempts.filter((a) => (a.score || 0) >= 23).map((a) => a.domainId),
  );
  const active = data.attempts.find((a) => a.status === "active");
  const nextEnrollment =
    data.enrollments.find((e) => !passed.has(e.domainId)) ||
    data.enrollments[0];
  const nextDomain = data.domains.find(
    (d) => d.id === nextEnrollment?.domainId,
  );
  const nextHref = active
    ? `/dashboard/exam/${active.id}`
    : nextDomain
      ? `/dashboard/course/${nextDomain.slug}`
      : "/dashboard/domains";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">YOUR LEARNING SPACE</span>
          <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
          <p>Your next skill is a little closer. Let’s keep moving.</p>
        </div>
        <Link className="btn btn-outline" href="/dashboard/domains">
          Explore domains
        </Link>
      </div>
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">
            {active
              ? "ASSESSMENT IN PROGRESS"
              : nextDomain
                ? "PICK UP WHERE YOU LEFT OFF"
                : "A SMALL START. A BIG POSSIBILITY."}
          </span>
          <h2>
            {active
              ? "Your assessment is waiting."
              : nextDomain
                ? nextDomain.name
                : "What will you learn next?"}
          </h2>
          <p>
            {active
              ? "Your server timer keeps running. Resume now to use the time remaining."
              : nextDomain
                ? "Your learning materials, progress, and next assessment are in one place."
                : "Discover a direction that fits your ambition. Start with a domain, then build at your own pace."}
          </p>
          <Link className="btn" href={nextHref}>
            {active
              ? "Resume assessment"
              : nextDomain
                ? "Continue learning"
                : "Find my learning path"}
          </Link>
          <Link className="dashboard-secondary" href="/dashboard/exams">
            Already skilled? Explore assessments
          </Link>
        </div>
        <div className="dashboard-milestones">
          {[
            [data.enrollments.length > 0, "Choose your learning path"],
            [passed.size > 0, "Pass your assessment"],
            [data.credentials.length > 0, "Unlock your achievement"],
          ].map(([done, label]) => (
            <span className={done ? "done" : ""} key={String(label)}>
              {done ? <CheckCircle2 /> : <Circle />}
              {label}
            </span>
          ))}
          <small>Learn freely. Documents are optional.</small>
        </div>
      </section>
      <div className="stats-grid">
        {[
          [BookOpen, data.enrollments.length, "Learning paths"],
          [
            ClipboardCheck,
            data.attempts.filter((a) => a.status === "submitted").length,
            "Assessments completed",
          ],
          [Award, data.credentials.length, "Credentials earned"],
          [Flame, passed.size, "Domains passed"],
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
      <nav className="dashboard-tabs" aria-label="Learning shortcuts">
        <Link className="selected" href="/dashboard" aria-current="page">
          Your overview
        </Link>
        <Link href="/dashboard/my-learning">My learning</Link>
        <Link href="/dashboard/exams">Assessments</Link>
        <Link href="/dashboard/documents">Achievements</Link>
      </nav>
      <div className="learning-overview">
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
              <Link href="/dashboard/domains" className="btn btn-outline">
                Discover a learning path
              </Link>
            </div>
          )}
        </section>
        <section className="panel next-step-card">
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
