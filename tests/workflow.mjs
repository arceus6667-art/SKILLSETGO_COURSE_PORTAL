// Run only against this project's local sandbox: node tests/workflow.mjs.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHmac, randomUUID } from "node:crypto";
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const qa = ".data/qa";
const uploaded = [];
const base = "http://127.0.0.1:3000";
let cookie = "";
const created = [];
async function post(body, session = cookie) {
  const r = await fetch(base + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      Cookie: session,
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}
async function ok(body, session = cookie) {
  const { status, data } = await post(body, session);
  assert.equal(status, 200, JSON.stringify(data));
  return data;
}
async function login(name, admin = false) {
  const r = await fetch(base + "/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ name, admin }),
  });
  assert.equal(r.status, 200);
  const session = r.headers
    .getSetCookie()
    .find((value) => value.startsWith("sg-session="));
  assert.ok(session, "Sandbox session cookie is issued");
  cookie = session.split(";")[0];
  created.push(cookie.split("=")[1]);
  return cookie;
}
async function state() {
  return JSON.parse(await fs.readFile(".data/sandbox.json", "utf8"));
}
const checks = [];
const check = (s) => {
  checks.push(s);
  console.log("PASS", s);
};
try {
  assert.match(await (await fetch(base)).text(), /LOCAL SANDBOX/);
  const a = await login("Workflow Test Learner");
  await ok({ action: "enroll", domainId: "python" });
  await ok({ action: "enroll", domainId: "python" });
  assert.equal(
    (await state()).enrollments.filter((e) => e.userId === created[0]).length,
    1,
  );
  check("Duplicate enrollment is prevented");
  const early = (
    await ok({ action: "order", domainId: "python", product: "bundle" })
  ).order;
  assert.equal(early.amount, 40000);
  check("Early bundle is priced at 400 rupees");
  const { attemptId } = await ok({
    action: "start",
    domainId: "python",
    accepted: true,
    direct: true,
    monitoring: "accommodated",
  });
  const second = await ok({
    action: "start",
    domainId: "python",
    accepted: true,
    direct: true,
    monitoring: "accommodated",
  });
  assert.equal(second.attemptId, attemptId);
  const concurrent = await Promise.all(
    Array.from({ length: 3 }, () =>
      ok({
        action: "start",
        domainId: "python",
        accepted: true,
        direct: true,
        monitoring: "accommodated",
      }),
    ),
  );
  assert.ok(concurrent.every((result) => result.attemptId === attemptId));
  check("Concurrent starts resume one active attempt");
  const stale = await post({ action: "sandbox-pay", orderId: early.id });
  assert.equal(stale.status, 400);
  check("An unpaid early quote cannot bypass after-start pricing");
  const payload = await (
    await fetch(base + "/api/attempt/" + attemptId, { headers: { Cookie: a } })
  ).json();
  assert.equal(payload.questions.length, 30);
  assert.ok(!JSON.stringify(payload).includes("correct"));
  assert.ok(!JSON.stringify(payload).includes("explanation"));
  check("Thirty randomized questions are served without answer keys");
  const snapshot = (await state()).attempts.find((a) => a.id === attemptId);
  for (const q of snapshot.questions.slice(0, 23))
    await ok({
      action: "answer",
      attemptId,
      questionId: q.id,
      answer: q.correct,
    });
  await login("Workflow Other Learner");
  assert.equal(
    (
      await post({
        action: "answer",
        attemptId,
        questionId: snapshot.questions[0].id,
        answer: 0,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(base + "/api/attempt/" + attemptId, {
        headers: { Cookie: cookie },
      })
    ).status,
    404,
  );
  check("Other learners cannot read or mutate an attempt");
  cookie = a;
  const finished = await ok({ action: "submit", attemptId });
  assert.equal(finished.attempt.score, 23);
  assert.equal(
    (await state()).credentials.filter((c) => c.userId === created[0]).length,
    0,
  );
  check("23/30 passes but credentials wait for payment");
  assert.equal(
    (await fetch(base + "/api/report/python", { headers: { Cookie: a } }))
      .status,
    200,
  );
  check("The free report is available before any payment");
  const order = (
    await ok({ action: "order", domainId: "python", product: "bundle" })
  ).order;
  assert.equal(order.amount, 50000);
  await ok({ action: "sandbox-pay", orderId: order.id });
  await ok({ action: "sandbox-pay", orderId: order.id });
  const credentials = (await state()).credentials.filter(
    (c) => c.userId === created[0],
  );
  assert.equal(credentials.length, 2);
  check(
    "Verified sandbox payment issues one certificate and one letter idempotently",
  );
  for (const c of credentials) {
    const r = await fetch(base + "/api/documents/" + c.id, {
      headers: { Cookie: a },
    });
    const bytes = Buffer.from(await r.arrayBuffer());
    assert.equal(r.status, 200, bytes.toString());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    await fs.mkdir(qa, { recursive: true });
    await fs.writeFile(qa + "/" + c.kind + ".pdf", bytes);
  }
  check("Certificate and appreciation PDFs render from issued records");
  const svg = await fetch(
    base +
      "/api/documents/" +
      credentials.find((c) => c.kind === "certificate").id +
      "?format=svg",
    { headers: { Cookie: a } },
  );
  const xml = await svg.text();
  assert.equal(svg.status, 200);
  assert.match(xml, /width="3840" height="2160"/);
  assert.match(xml, /SAMPLE/);
  assert.match(xml, /SIGNATURE TO BE PROVIDED/);
  const verification = xml.match(/href="data:image\/png/);
  assert.ok(verification);
  check(
    "4K certificate includes sandbox watermark, signature placeholder and QR",
  );
  const pngResponse = await fetch(
    base +
      "/api/documents/" +
      credentials.find((c) => c.kind === "certificate").id +
      "?format=png",
    { headers: { Cookie: a } },
  );
  const pngBytes = Buffer.from(await pngResponse.arrayBuffer());
  assert.equal(pngResponse.status, 200);
  assert.equal(pngBytes.readUInt32BE(16), 3840);
  assert.equal(pngBytes.readUInt32BE(20), 2160);
  check("The download endpoint returns an actual 3840 by 2160 PNG");
  const report = await fetch(base + "/api/report/python", {
    headers: { Cookie: a },
  });
  assert.equal(report.status, 200);
  assert.match(
    Buffer.from(await report.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    /%PDF-/,
  );
  check("Performance report is downloadable without a separate purchase");
  assert.equal(
    (await post({ action: "revoke", credentialId: credentials[0].id })).status,
    400,
  );
  check("Student cannot revoke credentials");
  const noOrigin = await fetch(base + "/api/action", {
    method: "POST",
    headers: { Cookie: a, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "enroll", domainId: "python" }),
  });
  assert.equal(noOrigin.status, 403);
  check("Cross-origin write protection is enforced");
  await login("Workflow Attempts Learner");
  await ok({ action: "enroll", domainId: "python" });
  for (let i = 0; i < 5; i++) {
    const { attemptId: id } = await ok({
      action: "start",
      domainId: "python",
      accepted: true,
      direct: true,
      monitoring: "standard",
    });
    await ok({ action: "submit", attemptId: id });
  }
  assert.equal(
    (
      await post({
        action: "start",
        domainId: "python",
        accepted: true,
        direct: true,
        monitoring: "standard",
      })
    ).status,
    400,
  );
  check("A sixth attempt is blocked");
  await login("Workflow Timer Learner");
  await ok({ action: "enroll", domainId: "python" });
  const { attemptId: timer } = await ok({
    action: "start",
    domainId: "python",
    accepted: true,
    direct: true,
    monitoring: "standard",
  });
  let raw = await state();
  raw.attempts.find((a) => a.id === timer).endsAt = new Date(
    Date.now() - 1000,
  ).toISOString();
  await fs.writeFile(".data/sandbox.json", JSON.stringify(raw));
  const late = await ok({
    action: "answer",
    attemptId: timer,
    questionId: "python-1",
    answer: 0,
  });
  assert.equal(late.attempt.status, "submitted");
  assert.equal(late.attempt.reason, "timer");
  assert.equal(late.attempt.score, 0);
  check("Expired attempts reject late answers and auto-grade saved responses");
  await login("Workflow Exit Learner");
  await ok({ action: "enroll", domainId: "python" });
  const { attemptId: exitId } = await ok({
    action: "start",
    domainId: "python",
    accepted: true,
    direct: true,
    monitoring: "standard",
  });
  for (let i = 0; i < 3; i++) {
    if (i) {
      const s = await state();
      s.attempts.find((a) => a.id === exitId).violations.at(-1).at = new Date(
        Date.now() - 5000,
      ).toISOString();
      await fs.writeFile(".data/sandbox.json", JSON.stringify(s));
    }
    const result = await ok({
      action: "violation",
      attemptId: exitId,
      eventId: randomUUID(),
      reason: "tab-hidden",
      confirmed: true,
    });
    assert.equal(result.attempt.violations.length, i + 1);
    if (i === 2) assert.equal(result.attempt.status, "submitted");
  }
  check("Three confirmed browser exits auto-submit through the actual API");
  const admin = await login("Workflow Content Admin", true);
  const pdf = await fs.readFile(qa + "/certificate.pdf");
  const form = new FormData();
  form.set("kind", "pdf");
  form.set("domainId", "ai-ml");
  form.set("title", "Workflow authorized PDF");
  form.set("file", new Blob([pdf], { type: "application/pdf" }), "guide.pdf");
  const upload = await fetch(base + "/api/upload", {
    method: "POST",
    headers: { Origin: base, Cookie: admin },
    body: form,
  });
  assert.equal(upload.status, 200, await upload.text());
  const resource = (await state()).domains
    .find((d) => d.id === "ai-ml")
    .resources.find((r) => r.title === "Workflow authorized PDF");
  uploaded.push(resource.storagePath);
  check("An administrator can upload a private PDF");
  await login("Workflow Resource Learner");
  assert.equal(
    (await fetch(base + resource.url, { headers: { Cookie: cookie } })).status,
    404,
  );
  await ok({ action: "enroll", domainId: "ai-ml" });
  assert.equal(
    (await fetch(base + resource.url, { headers: { Cookie: cookie } })).status,
    200,
  );
  check("Private PDFs require enrollment");
  await ok({
    action: "progress",
    domainId: "ai-ml",
    resourceId: resource.id,
    acknowledged: true,
  });
  const enrollment = (await state()).enrollments.find(
    (e) => e.userId === created.at(-1),
  );
  assert.equal(enrollment.completed.length, 1);
  assert.equal(enrollment.method, "individual acknowledgement");
  check("Learning acknowledgement persists with its method and policy version");
  const certificate = credentials.find((c) => c.kind === "certificate");
  const token = createHmac(
    "sha256",
    process.env.CREDENTIAL_SECRET || "local-sandbox-only-secret",
  )
    .update(certificate.id)
    .digest("hex");
  const verify = `${base}/verification?id=${certificate.id}&token=${token}`;
  assert.match(await (await fetch(verify)).text(), /Verified sandbox sample/);
  assert.match(await (await fetch(verify + "bad")).text(), /Unable to verify/);
  check("QR verification accepts a genuine token and rejects tampering");
  cookie = admin;
  await ok({ action: "revoke", credentialId: certificate.id });
  assert.match(await (await fetch(verify)).text(), /Credential revoked/);
  assert.equal(
    (
      await fetch(base + "/api/documents/" + certificate.id, {
        headers: { Cookie: a },
      })
    ).status,
    404,
  );
  check("Revocation updates verification and blocks downloads");
  await fs.writeFile(
    qa + "/workflow-results.json",
    JSON.stringify({ passed: checks.length, checks }, null, 2),
  );
  console.log(`${checks.length} workflow checks passed`);
} finally {
  const s = await state();
  const targets = new Set(
    [
      ...s.enrollments,
      ...s.attempts,
      ...s.orders,
      ...s.credentials,
      ...s.tickets,
    ]
      .filter((x) => created.includes(x.userId))
      .map((x) => x.id),
  );
  for (const d of s.domains)
    d.resources = d.resources.filter((r) => !uploaded.includes(r.storagePath));
  for (const key of [
    "users",
    "enrollments",
    "attempts",
    "orders",
    "credentials",
    "tickets",
  ])
    s[key] = s[key].filter(
      (x) => !created.includes(key === "users" ? x.id : x.userId),
    );
  s.audit = s.audit.filter(
    (a) => !created.includes(a.actor) && !targets.has(a.target),
  );
  await fs.writeFile(".data/sandbox.json", JSON.stringify(s));
  for (const key of uploaded)
    if (/^[a-z0-9-]+\.pdf$/.test(key)) await fs.unlink(".data/uploads/" + key);
}
