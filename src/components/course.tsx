"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayCircle, FileText, BookOpen, CheckCircle2 } from "lucide-react";
import type { Domain, Enrollment, Attempt } from "@/lib/types";
import { Button } from "./ui/button";
import { api, ActionButton } from "./action-form";
export function Course({
  domain: d,
  enrollment,
  attempts,
  sandbox,
}: {
  domain: Domain;
  enrollment?: Enrollment;
  attempts: Pick<Attempt, "id" | "score" | "status">[];
  sandbox: boolean;
}) {
  const [selected, setSelected] = useState(d.resources[0]?.id),
    [accepted, setAccepted] = useState(false),
    [direct, setDirect] = useState(true),
    [accommodated, setAccommodated] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  const r = d.resources.find((r) => r.id === selected);
  const active = attempts.find((a) => a.status === "active");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await api({
        action: "start",
        domainId: d.id,
        accepted,
        direct,
        monitoring: accommodated ? "accommodated" : "standard",
      });
      router.push(`/dashboard/exam/${result.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="course-intro">
        <span className="eyebrow gold">{d.category}</span>
        <h1>{d.name}</h1>
        <p className="lead">{d.description}</p>
        <div className="course-meta">
          <span>{d.resources.length} published resources</span>
          <span>30-question assessment</span>
          <span>{d.duration} minute exam</span>
          <span>Free performance report</span>
        </div>
      </div>
      {!enrollment ? (
        <section className="panel">
          <span className="eyebrow gold">YOUR LEARNING PATH</span>
          <h2>Build a foundation. Make your next move.</h2>
          <p>
            Enroll to access published materials and your assessment pathway.
          </p>
          <ul className="course-outcomes">
            {d.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
          <ActionButton body={{ action: "enroll", domainId: d.id }}>
            Enroll in this domain
          </ActionButton>
        </section>
      ) : (
        <div className="course-grid">
          <section>
            <div className="panel resource-player">
              {r ? (
                <>
                  <span className="eyebrow">LEARNING RESOURCE</span>
                  <h2>{r.title}</h2>
                  {r.kind === "video" && youtubeEmbed(r.url) ? (
                    <iframe
                      src={youtubeEmbed(r.url)!}
                      title={r.title}
                      allowFullScreen
                    />
                  ) : r.kind === "pdf" && r.url.startsWith("/") ? (
                    <iframe src={r.url} title={r.title} />
                  ) : (
                    <div className="empty">
                      <BookOpen />
                      <p>Open this resource in its source viewer.</p>
                    </div>
                  )}
                  <a
                    className="btn btn-outline"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {r.kind === "pdf" ? "PDF" : "resource"}
                  </a>
                  <ActionButton
                    variant="outline"
                    body={{
                      action: "progress",
                      domainId: d.id,
                      resourceId: r.id,
                      acknowledged: true,
                    }}
                  >
                    Mark as acknowledged
                  </ActionButton>
                </>
              ) : (
                <div className="empty">
                  <BookOpen />
                  <h3>Your library is being prepared.</h3>
                  <p>
                    No learning resources have been published for this domain
                    yet. An administrator can add videos, PDFs, and reading
                    material.
                  </p>
                </div>
              )}
            </div>
            <div className="panel spaced">
              <h3>Learning library</h3>
              {d.resources.map((resource) => (
                <button
                  className={`resource-row ${selected === resource.id ? "selected" : ""}`}
                  key={resource.id}
                  onClick={() => setSelected(resource.id)}
                >
                  {resource.kind === "video" ? <PlayCircle /> : <FileText />}
                  <span>{resource.title}</span>
                  {enrollment.completed.includes(resource.id) ? (
                    <CheckCircle2 size={18} />
                  ) : null}
                </button>
              ))}
              {d.resources.length ? (
                <ActionButton
                  variant="ghost"
                  confirmText="This records your own acknowledgement, not verified watch time. Resources remain available. Exam policy acceptance is still required. A timestamp and method will be retained. Continue?"
                  body={{
                    action: "progress",
                    domainId: d.id,
                    resourceId: "all",
                    bulk: true,
                    acknowledged: true,
                  }}
                >
                  Mark all as acknowledged
                </ActionButton>
              ) : null}
              <p className="muted">
                {enrollment.completed.length}/{d.resources.length} acknowledged
                · Self-reported progress
              </p>
            </div>
          </section>
          <aside className="panel readiness">
            <span className="eyebrow gold">EXAMINATION READINESS</span>
            <h2>Ready to prove it?</h2>
            <div className="exam-facts">
              <span>
                <strong>30</strong> questions
              </span>
              <span>
                <strong>{d.duration}</strong> minutes
              </span>
              <span>
                <strong>23/30</strong> to pass
              </span>
              <span>
                <strong>{Math.max(0, 5 - attempts.length)}</strong> attempts
                left
              </span>
            </div>
            {sandbox ? (
              <p className="notice">
                Sandbox: only Python has a demonstration question bank. No
                official assessment is implied.
              </p>
            ) : null}
            <p>
              Three confirmed tab or fullscreen exits cause autosubmission in
              standard mode. Monitoring cannot detect all activity and is not
              proof of misconduct.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={direct}
                onChange={(e) => setDirect(e.target.checked)}
              />{" "}
              Proceed directly without completing optional learning materials.
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={accommodated}
                onChange={(e) => setAccommodated(e.target.checked)}
              />{" "}
              Accessibility mode: disable fullscreen and tab penalties. Use for
              assistive technology or incompatible browsers. This choice is
              recorded.
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{" "}
              I understand the assessment requirements, optional learning
              pathway, timer, five-attempt limit, and{" "}
              <Link href="/exam-policy" target="_blank">
                examination policy
              </Link>
              .
            </label>
            <Button
              disabled={!accepted || busy || (attempts.length >= 5 && !active)}
              onClick={start}
            >
              {busy
                ? "Preparing assessment…"
                : active
                  ? "Resume examination"
                  : "Start examination"}
            </Button>
            <Link
              className="btn btn-outline"
              href={`/dashboard/payments?domain=${d.id}`}
            >
              Optional document bundle
            </Link>
            {error ? (
              <p role="alert" className="error">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </>
  );
}
function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (
      ["www.youtube.com", "youtube.com"].includes(u.hostname) &&
      u.searchParams.get("v")
    )
      return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
  } catch {}
  return null;
}
