"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock3, ShieldCheck, Flag, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "./action-form";
type Exam = {
  id: string;
  domainId: string;
  endsAt: string;
  status: "active" | "submitted";
  questions: { id: string; prompt: string; topic: string; options: string[] }[];
  answers: Record<string, number>;
  violations: { id: string; reason: string }[];
  score?: number;
  reason?: string;
  monitoring: string;
};
export function ExamRoom({ initial, title }: { initial: Exam; title: string }) {
  const [exam, setExam] = useState(initial),
    [index, setIndex] = useState(0),
    [now, setNow] = useState(Date.now()),
    [flags, setFlags] = useState<string[]>([]),
    [error, setError] = useState(""),
    [pending, setPending] = useState(0),
    [submitting, setSubmitting] = useState(false),
    [exit, setExit] = useState<string | null>(null),
    [armed, setArmed] = useState(false);
  const queue = useRef(Promise.resolve()),
    saveFailed = useRef(new Set<string>()),
    revision = useRef(0),
    hiddenAt = useRef(0),
    lastEvent = useRef(0),
    fullscreenSeen = useRef(false);
  const exitDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (exit && !exitDialog.current?.open) exitDialog.current?.showModal();
  }, [exit]);
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(exam.endsAt) - now) / 1000),
  );
  const refresh = useCallback(async () => {
    const requestedRevision = revision.current;
    try {
      const r = await fetch(`/api/attempt/${initial.id}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Could not sync assessment");
      const data = await r.json();
      setExam((prev) => ({
        ...data,
        answers:
          pending ||
          saveFailed.current.size ||
          revision.current !== requestedRevision
            ? prev.answers
            : data.answers,
      }));
    } catch (e) {
      setError(
        `${(e as Error).message}. Your timer continues. Reconnect as soon as possible.`,
      );
    }
  }, [initial.id, pending]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (exam.status !== "active") return;
    const t = setInterval(() => void refresh(), 10000);
    return () => clearInterval(t);
  }, [refresh, exam.status]);
  useEffect(() => {
    if (remaining === 0 && exam.status === "active") void refresh();
  }, [remaining, exam.status, refresh]);
  useEffect(() => {
    if (!armed || exam.monitoring !== "standard" || exam.status !== "active")
      return;
    function signal(reason: string) {
      if (Date.now() - lastEvent.current < 4500) return;
      lastEvent.current = Date.now();
      setExit(reason);
    }
    function visibility() {
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current) {
        if (Date.now() - hiddenAt.current >= 1500) signal("tab-hidden");
        hiddenAt.current = 0;
      }
    }
    function fullscreen() {
      if (document.fullscreenElement) {
        fullscreenSeen.current = true;
        return;
      }
      if (fullscreenSeen.current) signal("fullscreen-exit");
    }
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [armed, exam.monitoring, exam.status]);
  function answer(value: number) {
    revision.current++;
    const q = exam.questions[index];
    setExam((prev) => {
      const answers = { ...prev.answers };
      if (value < 0) delete answers[q.id];
      else answers[q.id] = value;
      return { ...prev, answers };
    });
    setPending((n) => n + 1);
    queue.current = queue.current.then(async () => {
      try {
        const data = await api({
          action: "answer",
          attemptId: exam.id,
          questionId: q.id,
          answer: value,
        });
        saveFailed.current.delete(q.id);
        if (!saveFailed.current.size) setError("");
        if (data.attempt.status === "submitted") setExam(data.attempt);
      } catch (e) {
        saveFailed.current.add(q.id);
        setError(
          `Answer not saved: ${(e as Error).message}. Select the answer again to retry.`,
        );
      } finally {
        setPending((n) => n - 1);
      }
    });
  }
  async function submit() {
    if (
      !window.confirm(
        "Submit your assessment? You cannot change answers afterward.",
      )
    )
      return;
    setSubmitting(true);
    await queue.current;
    if (saveFailed.current.size) {
      setError("An answer is not saved. Select it again before submitting.");
      setSubmitting(false);
      return;
    }
    try {
      const data = await api({ action: "submit", attemptId: exam.id });
      setExam(data.attempt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  if (exam.status === "submitted")
    return (
      <div className="result-card panel">
        <CheckCircle2 size={54} />
        <span className="eyebrow gold">ASSESSMENT COMPLETE</span>
        <h1>
          {(exam.score || 0) >= 23
            ? "You did it. Well earned."
            : "Every attempt is a step forward."}
        </h1>
        <div className="result-score">
          {exam.score}
          <small>/30</small>
        </div>
        <span className={`badge ${(exam.score || 0) >= 23 ? "success" : ""}`}>
          {(exam.score || 0) >= 23 ? "Passed" : "Keep learning"}
        </span>
        <p>Submission: {exam.reason}. Passing score: 23/30.</p>
        <p>
          Your performance report is complimentary. Paid credentials require
          both a passing result and verified payment.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/dashboard/results">
            View performance report
          </Link>
          <Link className="btn btn-outline" href="/dashboard/documents">
            My documents
          </Link>
        </div>
      </div>
    );
  const q = exam.questions[index];
  return (
    <>
      <div className="exam-top">
        <div>
          <span className="eyebrow gold">EXAMINATION CENTER</span>
          <h1>{title}</h1>
          <p>
            {exam.monitoring === "accommodated"
              ? "Accessibility mode · Exit penalties disabled"
              : "Standard mode · 3 confirmed exits cause autosubmission"}
          </p>
        </div>
        <div className={`timer ${remaining < 120 ? "danger" : ""}`}>
          <Clock3 />
          {Math.floor(remaining / 60)
            .toString()
            .padStart(2, "0")}
          :{(remaining % 60).toString().padStart(2, "0")}
          <small>REMAINING</small>
        </div>
      </div>
      {!armed ? (
        <div className="notice">
          <h3>Settle in before you begin.</h3>
          <p>
            Your server timer is already running. Standard mode uses supported
            fullscreen and tab events. Browser events are imperfect and cannot
            prove misconduct. If fullscreen is unavailable, continue without it;
            seek support for an accessibility adjustment.
          </p>
          <Button
            onClick={async () => {
              setArmed(true);
              if (
                exam.monitoring === "standard" &&
                document.fullscreenEnabled
              ) {
                try {
                  await document.documentElement.requestFullscreen();
                } catch {
                  setError(
                    "Fullscreen is unavailable. Tab monitoring still applies. Contact support if you need an adjustment.",
                  );
                }
              }
            }}
          >
            Continue to questions
          </Button>
        </div>
      ) : null}
      <div className="exam-grid">
        <section className="panel question-panel">
          <div className="panel-heading">
            <span className="eyebrow">
              QUESTION {index + 1} OF 30 · {q.topic}
            </span>
            <button
              className="icon-button"
              onClick={() =>
                setFlags((f) =>
                  f.includes(q.id)
                    ? f.filter((id) => id !== q.id)
                    : [...f, q.id],
                )
              }
            >
              <Flag size={16} />
              {flags.includes(q.id) ? "Flagged" : "Mark for review"}
            </button>
          </div>
          <h2>{q.prompt}</h2>
          <fieldset disabled={!armed || remaining === 0 || submitting}>
            <legend className="sr-only">Choose one answer</legend>
            {q.options.map((option, i) => (
              <label
                className={`answer-option ${exam.answers[q.id] === i ? "chosen" : ""}`}
                key={i}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={exam.answers[q.id] === i}
                  onChange={() => answer(i)}
                />
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
              </label>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            disabled={pending > 0}
            onClick={() => answer(-1)}
          >
            Clear response
          </Button>
          <div className="exam-navigation">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              Previous
            </Button>
            <span role="status">
              {pending
                ? "Saving answer…"
                : saveFailed.current.size
                  ? "Save failed"
                  : "Answers saved"}
            </span>
            <Button
              disabled={index === 29}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next question
            </Button>
          </div>
        </section>
        <aside className="panel question-nav">
          <h3>Your assessment</h3>
          <p>
            {Object.keys(exam.answers).length} answered ·{" "}
            {30 - Object.keys(exam.answers).length} remaining
          </p>
          <div className="question-numbers">
            {exam.questions.map((q, i) => (
              <button
                key={q.id}
                aria-label={`Question ${i + 1}${flags.includes(q.id) ? ", marked for review" : ""}`}
                className={`${index === i ? "current" : ""} ${q.id in exam.answers ? "answered" : ""} ${flags.includes(q.id) ? "flagged" : ""}`}
                onClick={() => setIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p>
            <ShieldCheck size={16} /> {exam.violations.length}/3 confirmed exits
          </p>
          <Button disabled={submitting || pending > 0} onClick={submit}>
            {submitting ? "Submitting…" : "Submit assessment"}
          </Button>
          <p className="muted">
            The server enforces your deadline. Changes after it expires are
            rejected. Keep this page connected.
          </p>
        </aside>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {exit ? (
        <dialog
          ref={exitDialog}
          className="panel modal"
          aria-modal="true"
          aria-labelledby="exit-title"
          onCancel={(e) => {
            e.preventDefault();
            setExit(null);
          }}
        >
          <h2 id="exit-title">Review a detected exit</h2>
          <p>
            The browser reported a{" "}
            {exit === "tab-hidden" ? "tab switch" : "fullscreen exit"}. If this
            was a system prompt or assistive technology, dismiss it. Confirm
            only if you intentionally left the examination.
          </p>
          <p>
            Confirmed exits: {exam.violations.length}/3. The third causes
            autosubmission. Events are self-confirmed and cannot prove
            misconduct.
          </p>
          <Button
            autoFocus
            onClick={async () => {
              try {
                const data = await api({
                  action: "violation",
                  attemptId: exam.id,
                  eventId: crypto.randomUUID(),
                  reason: exit,
                  confirmed: true,
                });
                setExam(data.attempt);
                setExit(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Confirm examination exit
          </Button>
          <Button variant="outline" onClick={() => setExit(null)}>
            System or accessibility event
          </Button>
        </dialog>
      ) : null}
    </>
  );
}
