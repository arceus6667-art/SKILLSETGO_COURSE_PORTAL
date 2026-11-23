import test from "node:test";
import assert from "node:assert/strict";
import { seed, questions } from "../src/lib/catalog";
import {
  finish,
  quote,
  issue,
  publicAttempt,
  safeEqual,
  signature,
  permit,
  sweep,
  confirmViolation,
  capturedPayment,
} from "../src/lib/engine";
import type { Attempt } from "../src/lib/types";
function setup(score: number) {
  const s = seed();
  s.users.push({
    id: "u",
    name: "Test Learner",
    email: "test@example.invalid",
    role: "user",
  });
  const a: Attempt = {
    id: "a",
    userId: "u",
    domainId: "python",
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60000).toISOString(),
    status: "active",
    questions: structuredClone(questions),
    answers: {},
    violations: [],
    monitoring: "standard",
    consent: { version: "test", at: new Date().toISOString(), direct: true },
  };
  for (const q of a.questions.slice(0, score)) a.answers[q.id] = q.correct;
  s.attempts.push(a);
  return { s, a };
}
test("22 fails and 23 passes; no credential without payment", () => {
  for (const n of [22, 23]) {
    const { s, a } = setup(n);
    finish(s, a, "manual", true);
    assert.equal(a.score, n);
    assert.equal(s.credentials.length, 0);
    assert.equal(a.status, "submitted");
  }
});
test("verified bundle and pass issues exactly one of each document", () => {
  const { s, a } = setup(23);
  s.orders.push({
    id: "o",
    userId: "u",
    domainId: "python",
    product: "bundle",
    amount: 40000,
    currency: "INR",
    status: "paid",
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    mode: "sandbox",
  });
  finish(s, a, "manual", true);
  assert.equal(s.credentials.length, 2);
  issue(s, "u", "python", true);
  assert.equal(s.credentials.length, 2);
  assert.ok(s.credentials.every((c) => c.mode === "sandbox"));
});
test("price changes when the first attempt starts; individual price stays fixed", () => {
  const { s } = setup(0);
  assert.equal(quote(s, "u", "python", "bundle"), 50000);
  s.attempts = [];
  assert.equal(quote(s, "u", "python", "bundle"), 40000);
  assert.equal(quote(s, "u", "python", "letter"), 35000);
});
test("expiry grades only saved responses and is idempotent", () => {
  const { s, a } = setup(10);
  a.endsAt = new Date(Date.now() - 1).toISOString();
  sweep(s, true);
  assert.equal(a.reason, "timer");
  assert.equal(a.score, 10);
  const auditLength = s.audit.length;
  sweep(s, true);
  assert.equal(s.audit.length, auditLength);
});
test("serialized exam has no keys, explanations or approval flags", () => {
  const { a } = setup(0);
  const serialized = JSON.stringify(publicAttempt(a));
  assert.ok(!serialized.includes("correct"));
  assert.ok(!serialized.includes("explanation"));
  assert.ok(!serialized.includes("approved"));
});
test("permissions use trusted roles and signatures reject tampering", () => {
  assert.throws(() =>
    permit({ id: "u", name: "x", email: "x", role: "user" }, "finance"),
  );
  assert.doesNotThrow(() =>
    permit({ id: "a", name: "x", email: "x", role: "admin" }, "finance"),
  );
  assert.equal(
    safeEqual(
      signature("order|payment", "secret"),
      signature("order|other", "secret"),
    ),
    false,
  );
  assert.equal(safeEqual("short", "longer"), false);
});
test("three separately confirmed exits auto-submit; duplicates and overlapping events do not count", () => {
  const { s, a } = setup(8);
  const now = Date.now();
  confirmViolation(s, a, "one", "tab-hidden", true, now);
  confirmViolation(s, a, "one", "tab-hidden", true, now + 5000);
  confirmViolation(s, a, "overlap", "fullscreen-exit", true, now + 10);
  assert.equal(a.violations.length, 1);
  confirmViolation(s, a, "two", "tab-hidden", true, now + 5001);
  assert.equal(a.status, "active");
  confirmViolation(s, a, "three", "fullscreen-exit", true, now + 10002);
  assert.equal(a.status, "submitted");
  assert.equal(a.reason, "three confirmed exits");
  assert.equal(a.score, 8);
});
test("accessibility mode is exempt from exit penalties", () => {
  const { s, a } = setup(0);
  a.monitoring = "accommodated";
  for (let i = 0; i < 4; i++)
    confirmViolation(
      s,
      a,
      String(i),
      "tab-hidden",
      true,
      Date.now() + i * 5000,
    );
  assert.equal(a.status, "active");
  assert.equal(a.violations.length, 0);
});
test("late early-bundle provider capture is recorded for review, without issuing documents", () => {
  const { s, a } = setup(23);
  finish(s, a, "manual", false);
  const order = {
    id: "late",
    userId: "u",
    domainId: "python",
    product: "bundle" as const,
    amount: 40000,
    currency: "INR" as const,
    status: "created" as const,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    mode: "live" as const,
  };
  s.orders.push(order);
  capturedPayment(s, s.orders[0], "pay_late", Date.now() + 1000);
  assert.equal(s.orders[0].status, "review");
  assert.equal(s.credentials.length, 0);
});
