import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import { sweep } from "@/lib/engine";
import { PortalShell } from "@/components/portal-shell";
import { ActionForm, ActionButton } from "@/components/action-form";
import { AdminUsers } from "@/components/admin-users";
import { Upload } from "@/components/upload";
export const dynamic = "force-dynamic";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requested = (await searchParams).view || "overview";
  const view = [
    "overview",
    "students",
    "content",
    "questions",
    "finance",
    "documents",
    "support",
    "settings",
    "audit",
  ].includes(requested)
    ? requested
    : "overview";
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role === "user") redirect("/dashboard");
  const s = await transact((s) => {
    sweep(s, sandbox);
    return s;
  });
  const content = view === "content",
    exams = view === "questions",
    finance = view === "finance",
    support = view === "support";
  const heading = {
    overview: [
      "Your platform, at a glance.",
      "A clear view of learning, assessments, and achievements.",
    ],
    students: [
      "The people behind the progress.",
      "Find user accounts and see their learning activity.",
    ],
    content: [
      "Build a better learning experience.",
      "Manage your twelve domains and publish authorized resources.",
    ],
    questions: [
      "A clear standard for every assessment.",
      "Review, publish, and manage your examination banks.",
    ],
    finance: [
      "Every transaction, accounted for.",
      "Track document purchases and verified payment captures.",
    ],
    documents: [
      "Achievements with a record.",
      "Review issued documents and manage verification status.",
    ],
    support: [
      "Help your learners move forward.",
      "Review questions, accommodation needs, and support requests.",
    ],
    settings: [
      "Make the platform yours.",
      "Manage brand assets, signatures, and account setup.",
    ],
    audit: [
      "A record of every important action.",
      "Review administrative changes and platform activity.",
    ],
  }[
    view as
      | "overview"
      | "students"
      | "content"
      | "questions"
      | "finance"
      | "documents"
      | "support"
      | "settings"
      | "audit"
  ];
  const paid = s.orders.filter((o) => o.status === "paid");
  return (
    <PortalShell user={u} sandbox={sandbox}>
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">ADMINISTRATION</span>
          <h1>{heading[0]}</h1>
          <p>{heading[1]}</p>
        </div>
        <span className="badge">{u.role.replaceAll("_", " ")}</span>
      </div>
      {view === "students" ? (
        <AdminUsers
          users={s.users.map((account) => ({
            ...account,
            enrollments: s.enrollments.filter((e) => e.userId === account.id)
              .length,
            passed: s.attempts.filter(
              (a) => a.userId === account.id && (a.score || 0) >= 23,
            ).length,
            documents: s.credentials.filter(
              (c) => c.userId === account.id && !c.revoked,
            ).length,
          }))}
        />
      ) : null}
      {view === "overview" ? (
        <section id="analytics">
          <div className="stats-grid">
            <div className="stat">
              <strong>{s.users.filter((u) => u.role === "user").length}</strong>
              <span>Learners</span>
            </div>
            <div className="stat">
              <strong>{s.enrollments.length}</strong>
              <span>Enrollments</span>
            </div>
            <div className="stat">
              <strong>
                {s.attempts.filter((a) => a.status === "submitted").length}
              </strong>
              <span>Completed exams</span>
            </div>
            <div className="stat">
              <strong>{s.credentials.filter((c) => !c.revoked).length}</strong>
              <span>Issued documents</span>
            </div>
          </div>
          <div className="panel">
            <h2>Learning across domains</h2>
            {s.domains.map((d) => {
              const count = s.enrollments.filter(
                (e) => e.domainId === d.id,
              ).length;
              return (
                <div className="analytics-row" key={d.id}>
                  <span>{d.short}</span>
                  <div className="progress-bar">
                    <span
                      style={{
                        width: `${s.enrollments.length ? (count / s.enrollments.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
          <div className="admin-quick-actions">
            <Link href="/admin?view=content">
              <span>COURSE CONTENT</span>
              <h3>Shape the learning journey</h3>
              <p>
                {s.domains.filter((d) => d.published).length} published domains
                · {s.domains.reduce((n, d) => n + d.resources.length, 0)}{" "}
                resources
              </p>
            </Link>
            <Link href="/admin?view=questions">
              <span>EXAMINATION BANKS</span>
              <h3>Keep assessments ready</h3>
              <p>
                {s.questions.filter((q) => q.approved).length} reviewed
                questions
              </p>
            </Link>
            <Link href="/admin?view=support">
              <span>LEARNER SUPPORT</span>
              <h3>Be there when it matters</h3>
              <p>
                {s.tickets.filter((t) => t.status === "open").length} open
                support requests
              </p>
            </Link>
          </div>
        </section>
      ) : null}
      {content ? (
        <section id="content" className="spaced">
          <h2>Domains & learning content</h2>
          {s.domains.map((d) => (
            <details className="panel admin-detail" key={d.id}>
              <summary>
                {d.name}
                <span className="badge">
                  {d.published ? "Published" : "Draft"} · {d.resources.length}{" "}
                  resources
                </span>
              </summary>
              <div className="two-grid">
                <ActionForm action="domain" initial={{ domainId: d.id }}>
                  <label>
                    Domain title
                    <input
                      name="name"
                      defaultValue={d.name}
                      required
                      minLength={3}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      name="description"
                      defaultValue={d.description}
                      required
                      minLength={10}
                    />
                  </label>
                  <label>
                    Exam duration (minutes)
                    <input
                      type="number"
                      name="duration"
                      min={5}
                      max={180}
                      defaultValue={d.duration}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      name="published"
                      type="checkbox"
                      defaultChecked={d.published}
                    />{" "}
                    Publish domain
                  </label>
                </ActionForm>
                <div>
                  <h3>Add a learning resource</h3>
                  <ActionForm
                    action="resource"
                    initial={{ domainId: d.id }}
                    label="Add resource"
                  >
                    <label>
                      Title
                      <input name="title" minLength={3} required />
                    </label>
                    <label>
                      Type
                      <select name="kind">
                        <option value="video">Video</option>
                        <option value="reading">Reading</option>
                        <option value="pdf">Public authorized PDF link</option>
                      </select>
                    </label>
                    <label>
                      HTTPS URL
                      <input
                        name="url"
                        type="url"
                        required
                        placeholder="https://"
                      />
                    </label>
                  </ActionForm>
                  <Upload domainId={d.id} />
                </div>
              </div>
              <h3>Published resources</h3>
              {d.resources.length ? (
                d.resources.map((r) => (
                  <p key={r.id}>
                    {r.kind.toUpperCase()} · {r.title}
                  </p>
                ))
              ) : (
                <p className="muted">No resources yet.</p>
              )}
            </details>
          ))}
        </section>
      ) : null}
      {exams ? (
        <section id="questions" className="panel spaced">
          <span className="eyebrow gold">EXAMINATION MANAGEMENT</span>
          <h2>Review first. Publish with confidence.</h2>
          <p>
            Import human-reviewed questions as JSON. The engine requires 9 easy,
            15 medium, and 6 hard questions per assessment. Publish a larger
            bank for varied retakes.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Reviewed bank</th>
                  <th>Attempts</th>
                  <th>Passes</th>
                </tr>
              </thead>
              <tbody>
                {s.domains.map((d) => (
                  <tr key={d.id}>
                    <td>{d.short}</td>
                    <td>
                      {
                        s.questions.filter(
                          (q) => q.domainId === d.id && q.approved,
                        ).length
                      }
                      {sandbox && d.id === "python" ? " + 30 demo" : ""}
                    </td>
                    <td>
                      {s.attempts.filter((a) => a.domainId === d.id).length}
                    </td>
                    <td>
                      {
                        s.attempts.filter(
                          (a) => a.domainId === d.id && (a.score || 0) >= 23,
                        ).length
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ActionForm action="questions" label="Publish reviewed questions">
            <label>
              Domain
              <select name="domainId">
                {s.domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Question JSON
              <textarea
                name="questions"
                rows={8}
                required
                placeholder={
                  '[{"prompt":"Your reviewed question?","topic":"Fundamentals","options":["A","B","C","D"],"correct":0,"explanation":"Why A is correct","difficulty":"easy"}]'
                }
              />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="approved" required /> I have checked
              accuracy, syllabus relevance, unambiguous wording, distinct
              choices, and exactly one correct answer.
            </label>
          </ActionForm>
          <p className="muted">
            AI generation is not connected. No unreviewed generated material
            enters live examinations.
          </p>
        </section>
      ) : null}
      {finance ? (
        <section id="finance" className="panel spaced">
          <h2>Payments & reconciliation</h2>
          <p className="big-price">
            ₹{paid.reduce((sum, o) => sum + o.amount, 0) / 100}
            <small> verified {sandbox ? "sandbox" : ""} purchases</small>
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Domain</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Provider reference</th>
                </tr>
              </thead>
              <tbody>
                {s.orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.id.slice(0, 8)}
                      <small>{o.mode}</small>
                    </td>
                    <td>{o.domainId}</td>
                    <td>{o.product}</td>
                    <td>₹{o.amount / 100}</td>
                    <td>{o.status}</td>
                    <td>{o.paymentId || "Awaiting capture"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            Payment status is set only by sandbox simulation or server-verified
            capture. Manual payment overrides and refunds are not enabled.
          </p>
        </section>
      ) : null}
      {support ? (
        <section id="support" className="panel spaced">
          <h2>Support requests</h2>
          {s.tickets.length ? (
            s.tickets.map((t) => (
              <article key={t.id} className="ticket">
                <span className="badge">{t.status}</span>
                <p>{t.message}</p>
                <small>{s.users.find((u) => u.id === t.userId)?.email}</small>
                {t.status === "open" ? (
                  <ActionButton
                    variant="outline"
                    body={{ action: "resolve", ticketId: t.id }}
                  >
                    Mark resolved
                  </ActionButton>
                ) : null}
              </article>
            ))
          ) : (
            <p className="muted">No support requests yet.</p>
          )}
        </section>
      ) : null}
      {u.role === "admin" ? (
        <>
          <section
            id="settings"
            className="panel spaced"
            hidden={view !== "settings" && view !== "documents"}
          >
            <h2>Branding & document settings</h2>
            <p>
              The authentic logo was retrieved from the official website.
              Signature status:{" "}
              {s.settings.signaturePath
                ? "Original signature uploaded"
                : "Awaiting your original signature"}
              .
            </p>
            <Upload signature />
            <p className="muted">
              Only User and Admin profiles are supported. The project owner
              assigns Admin access in the protected database profile. Users
              cannot change their own role.
            </p>
            <h3>Credential register</h3>
            {s.credentials.map((c) => (
              <div className="learning-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <p>
                    {c.kind} · {c.domainId} · {c.mode}
                  </p>
                  <small>{c.id}</small>
                </div>
                {c.revoked ? (
                  <span className="badge">Revoked</span>
                ) : (
                  <ActionButton
                    variant="outline"
                    body={{ action: "revoke", credentialId: c.id }}
                    confirmText="Revoke this credential? Its public verification page will show revoked status."
                  >
                    Revoke
                  </ActionButton>
                )}
              </div>
            ))}
          </section>
          <section
            id="audit"
            className="panel spaced"
            hidden={view !== "audit"}
          >
            <h2>Audit trail</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {s.audit
                    .slice(-100)
                    .reverse()
                    .map((a) => (
                      <tr key={a.id}>
                        <td>{a.at.slice(0, 19).replace("T", " ")}</td>
                        <td>{a.actor.slice(0, 12)}</td>
                        <td>{a.action}</td>
                        <td>{a.target.slice(0, 15)}</td>
                        <td>{a.detail}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </PortalShell>
  );
}
