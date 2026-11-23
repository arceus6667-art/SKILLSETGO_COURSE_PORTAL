import {
  randomInt,
  randomUUID,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import type { Attempt, State, User, Role, Order } from "./types";
export const POLICY = "2026-11-v1";
const permissions: Record<string, Role[]> = {
  content: ["admin"],
  exams: ["admin"],
  finance: ["admin"],
  support: ["admin"],
  settings: ["admin"],
};
export function permit(user: User, permission: string) {
  if (!permissions[permission]?.includes(user.role))
    throw new Error("Permission denied");
}
export function audit(
  s: State,
  actor: string,
  action: string,
  target: string,
  detail?: string,
) {
  s.audit.push({
    id: randomUUID(),
    actor,
    action,
    target,
    detail,
    at: new Date().toISOString(),
  });
}
export function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function quote(
  s: State,
  userId: string,
  domainId: string,
  product: Order["product"],
) {
  return product === "bundle"
    ? s.attempts.some((a) => a.userId === userId && a.domainId === domainId)
      ? 50000
      : 40000
    : 35000;
}
export function issue(
  s: State,
  userId: string,
  domainId: string,
  local: boolean,
) {
  const passed = s.attempts.filter(
    (a) =>
      a.userId === userId &&
      a.domainId === domainId &&
      a.status === "submitted" &&
      (a.score || 0) >= 23,
  );
  if (!passed.length) return;
  const user = s.users.find((u) => u.id === userId)!;
  const paid = s.orders.filter(
    (o) =>
      o.userId === userId && o.domainId === domainId && o.status === "paid",
  );
  for (const kind of ["certificate", "letter"] as const) {
    if (
      s.credentials.some(
        (c) =>
          c.userId === userId && c.domainId === domainId && c.kind === kind,
      )
    )
      continue;
    if (!paid.some((o) => o.product === kind || o.product === "bundle"))
      continue;
    const doc = {
      id: randomUUID(),
      userId,
      domainId,
      domainName: s.domains.find((d) => d.id === domainId)!.name,
      signaturePath: s.settings.signaturePath,
      kind,
      name: user.name,
      score: Math.max(...passed.map((a) => a.score || 0)),
      issuedAt: new Date().toISOString(),
      revoked: false,
      mode: local ? ("sandbox" as const) : ("live" as const),
    };
    s.credentials.push(doc);
    audit(s, "system", "credential.issued", doc.id);
  }
}
export function finish(s: State, a: Attempt, reason: string, local: boolean) {
  if (a.status === "submitted") return a;
  a.score = a.questions.reduce(
    (score, q) => score + (a.answers[q.id] === q.correct ? 1 : 0),
    0,
  );
  a.status = "submitted";
  a.reason = reason;
  a.submittedAt = new Date().toISOString();
  audit(s, a.userId, "exam.submitted", a.id, reason);
  issue(s, a.userId, a.domainId, local);
  return a;
}
export function confirmViolation(
  s: State,
  a: Attempt,
  eventId: string,
  reason: string,
  local: boolean,
  now = Date.now(),
) {
  if (
    a.status !== "active" ||
    a.monitoring !== "standard" ||
    a.violations.some((v) => v.id === eventId)
  )
    return;
  const last = a.violations.at(-1);
  if (last && now - Date.parse(last.at) <= 4000) return;
  a.violations.push({ id: eventId, at: new Date(now).toISOString(), reason });
  audit(s, a.userId, "exam.violation-confirmed", a.id, reason);
  if (a.violations.length >= 3) finish(s, a, "three confirmed exits", local);
}
export function capturedPayment(
  s: State,
  order: Order,
  paymentId: string,
  capturedAt: number,
) {
  if (order.status !== "created") return order.status;
  if (s.orders.some((o) => o.id !== order.id && o.paymentId === paymentId))
    throw new Error("Payment already belongs to another order");
  const first = s.attempts
    .filter((a) => a.userId === order.userId && a.domainId === order.domainId)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))[0];
  const lateEarlyBundle =
    order.product === "bundle" &&
    order.amount === 40000 &&
    first &&
    capturedAt > Date.parse(first.startedAt);
  order.paymentId = paymentId;
  order.paidAt = new Date(capturedAt).toISOString();
  order.status =
    lateEarlyBundle || capturedAt > Date.parse(order.expiresAt)
      ? "review"
      : "paid";
  audit(
    s,
    "razorpay",
    order.status === "paid" ? "payment.verified" : "payment.review-required",
    order.id,
  );
  if (order.status === "paid") issue(s, order.userId, order.domainId, false);
  return order.status;
}
export function sweep(s: State, local: boolean) {
  for (const a of s.attempts)
    if (a.status === "active" && Date.now() >= Date.parse(a.endsAt))
      finish(s, a, "timer", local);
}
export function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function verifyToken(id: string, local: boolean) {
  return signature(
    id,
    process.env.CREDENTIAL_SECRET ||
      (local ? "local-sandbox-only-secret" : "missing"),
  );
}
export function publicAttempt(a: Attempt) {
  return {
    ...a,
    questions: a.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      topic: q.topic,
      options: q.options,
    })),
  };
}
