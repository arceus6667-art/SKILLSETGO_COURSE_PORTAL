import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, ClipboardCheck } from "lucide-react";
import { requirePageUser as requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep } from "@/lib/engine";
import { DomainExplorer } from "@/components/domain-explorer";
import { DomainGrid } from "@/components/domain-grid";
import { Payments } from "@/components/payments";
import { ActionForm } from "@/components/action-form";
import { CertificatePreview } from "@/components/certificate-preview";
const headings: Record<string, [string, string]> = {
  domains: [
    "A world of possibility.",
    "Choose the direction you want to grow.",
  ],
  "my-learning": ["Your learning, in motion.", "Pick up where you left off."],
  exams: ["Ready for your next milestone?", "Demonstrate what you know."],
  results: [
    "Progress you can see.",
    "Every assessment tells part of your story.",
  ],
  documents: [
    "Your achievements, together.",
    "A record of the knowledge you have demonstrated.",
  ],
  payments: [
    "Invest in your achievement.",
    "Optional documents. Transparent pricing.",
  ],
  profile: [
    "Make this space yours.",
    "Keep your details accurate for your future credentials.",
  ],
  support: [
    "A little help goes a long way.",
    "Ask a question, request an accommodation, or report a problem.",
  ],
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ domain?: string; q?: string }>;
}) {
  const { section } = await params;
  if (!headings[section]) notFound();
  const u = await requireUser(),
    query = await searchParams;
  const data = await transact((s) => {
    sweep(s, sandbox);
    return {
      domains: s.domains.filter((d) => d.published),
      enrollments: s.enrollments.filter((e) => e.userId === u.id),
      attempts: s.attempts
        .filter((a) => a.userId === u.id)
        .map((a) => ({
          id: a.id,
          domainId: a.domainId,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          status: a.status,
          score: a.score,
          reason: a.reason,
          violations: a.violations.length,
        })),
      orders: s.orders.filter((o) => o.userId === u.id),
      credentials: s.credentials.filter((c) => c.userId === u.id),
      tickets: s.tickets.filter((t) => t.userId === u.id),
    };
  });
  const enrolled = data.domains.filter((d) =>
    data.enrollments.some((e) => e.domainId === d.id),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">YOUR LEARNING SPACE</span>
          <h1>{headings[section][0]}</h1>
          <p>{headings[section][1]}</p>
        </div>
      </div>
      {section === "domains" ? (
        <DomainExplorer domains={data.domains} initial={query.q || ""} />
      ) : null}
      {section === "my-learning" ? (
        enrolled.length ? (
          <DomainGrid domains={enrolled} portal />
        ) : (
          <Empty
            icon={<BookOpen />}
            title="Your journey is yours to begin."
            text="Choose a domain and enroll to start building your learning record."
          />
        )
      ) : null}
      {section === "exams" ? (
        <>
          <div className="notice">
            30 questions · 23/30 to pass · Up to 5 attempts · Server-enforced
            deadline
          </div>
          {data.attempts
            .filter((a) => a.status === "active")
            .map((a) => (
              <div className="panel spaced" key={a.id}>
                <h2>Assessment in progress</h2>
                <Link
                  className="btn btn-primary"
                  href={`/dashboard/exam/${a.id}`}
                >
                  Resume assessment
                </Link>
              </div>
            ))}
          {enrolled.length ? (
            <DomainGrid domains={enrolled} portal />
          ) : (
            <Empty
              icon={<ClipboardCheck />}
              title="Choose a domain first."
              text="Enrollment gives you access to the learning library and exam readiness page."
            />
          )}
        </>
      ) : null}
      {section === "results" ? (
        <>
          {data.attempts.length ? (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Result</th>
                    <th>Score</th>
                    <th>Submitted</th>
                    <th>Free report</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {data.domains.find((d) => d.id === a.domainId)?.name ||
                          a.domainId}
                      </td>
                      <td>
                        <span
                          className={`badge ${(a.score || 0) >= 23 ? "success" : ""}`}
                        >
                          {a.status === "active"
                            ? "In progress"
                            : (a.score || 0) >= 23
                              ? "Passed"
                              : "Not passed"}
                        </span>
                      </td>
                      <td>{a.score === undefined ? "—" : `${a.score}/30`}</td>
                      <td>
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleDateString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )
                          : "—"}
                      </td>
                      <td>
                        {a.status === "submitted" ? (
                          <a
                            href={`/api/report/${a.domainId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download PDF
                          </a>
                        ) : (
                          <Link href={`/dashboard/exam/${a.id}`}>
                            Resume exam
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={<ClipboardCheck />}
              title="Your progress will appear here."
              text="Complete an assessment to receive your free performance report."
            />
          )}
          <p className="muted">
            Reports are available for completed attempts regardless of score or
            purchase.
          </p>
        </>
      ) : null}
      {section === "payments" ? (
        <Payments
          domains={enrolled}
          started={[...new Set(data.attempts.map((a) => a.domainId))]}
          orders={data.orders}
          sandbox={sandbox}
          initial={query.domain}
        />
      ) : null}
      {section === "documents" ? (
        <>
          {data.credentials.length ? (
            <div className="two-grid">
              {data.credentials.map((c) => (
                <section className="panel" key={c.id}>
                  <Award className="gold" />
                  <span className="badge">
                    {c.revoked
                      ? "Revoked"
                      : c.mode === "sandbox"
                        ? "Sandbox sample"
                        : "Issued"}
                  </span>
                  <h2>
                    {c.kind === "certificate"
                      ? "Certificate of Completion"
                      : "Letter of Appreciation"}
                  </h2>
                  <p>
                    {data.domains.find((d) => d.id === c.domainId)?.name ||
                      c.domainId}
                  </p>
                  <small>{c.id}</small>
                  {!c.revoked ? (
                    <>
                      <a
                        className="btn btn-primary spaced"
                        href={`/api/documents/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download PDF
                      </a>
                      {c.kind === "certificate" ? (
                        <CertificatePreview
                          src={`/api/documents/${c.id}?format=svg`}
                        />
                      ) : null}
                    </>
                  ) : null}
                </section>
              ))}
            </div>
          ) : (
            <Empty
              icon={<Award />}
              title="Make room for your achievements."
              text="Documents are issued automatically when you pass and have a verified document purchase."
            />
          )}
          <section className="panel spaced">
            <span className="eyebrow gold">
              DESIGNED FOR YOUR NEXT MILESTONE
            </span>
            <h2>Certificate of Completion · 4K preview</h2>
            <p>
              Authentic Skill Set Go logo. Landscape 3840 × 2160. Signature
              placeholder awaiting your original signature.
            </p>
            <CertificatePreview />
          </section>
        </>
      ) : null}
      {section === "profile" ? (
        <section className="panel narrow">
          <ActionForm action="profile">
            <label>
              Full legal name
              <input
                name="name"
                defaultValue={u.name}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              Email
              <input value={u.email} disabled readOnly />
            </label>
            <label>
              Country
              <input name="country" maxLength={80} defaultValue={u.country} />
            </label>
            <label>
              College or university (optional)
              <input name="college" maxLength={150} defaultValue={u.college} />
            </label>
            <p className="muted">
              Name corrections after document issuance require support approval.
            </p>
          </ActionForm>
        </section>
      ) : null}
      {section === "support" ? (
        <div className="two-grid">
          <section className="panel">
            <h2>How can we help?</h2>
            <ActionForm action="ticket" label="Create support request">
              <label>
                Your request
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={6}
                  placeholder="Tell us what you need, including any examination accommodations."
                />
              </label>
            </ActionForm>
          </section>
          <section className="panel">
            <h2>Your support requests</h2>
            {data.tickets.length ? (
              data.tickets.map((t) => (
                <article className="ticket" key={t.id}>
                  <span className="badge">{t.status}</span>
                  <p>{t.message}</p>
                  <small>
                    {new Date(t.at).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </small>
                </article>
              ))
            ) : (
              <p className="muted">
                Your requests and their status will appear here.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="empty panel">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
      <Link href="/dashboard/domains" className="btn btn-outline">
        Explore domains
      </Link>
    </section>
  );
}
