import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { transact, sandbox } from "@/lib/store";
import {
  audit,
  finish,
  issue,
  permit,
  POLICY,
  publicAttempt,
  quote,
  shuffle,
  sweep,
  safeEqual,
  signature,
  confirmViolation,
  capturedPayment,
} from "@/lib/engine";
import type { Attempt, Question } from "@/lib/types";
import { validOrigin } from "@/lib/security";
export const runtime = "nodejs";
const id = z.string().min(1).max(100);
const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll"), domainId: id }),
  z.object({
    action: z.literal("progress"),
    domainId: id,
    resourceId: id,
    bulk: z.boolean().optional(),
    acknowledged: z.literal(true),
  }),
  z.object({
    action: z.literal("start"),
    domainId: id,
    accepted: z.literal(true),
    direct: z.boolean(),
    monitoring: z.enum(["standard", "accommodated"]),
  }),
  z.object({
    action: z.literal("answer"),
    attemptId: id,
    questionId: id,
    answer: z.number().int().min(-1).max(3),
  }),
  z.object({ action: z.literal("submit"), attemptId: id }),
  z.object({
    action: z.literal("violation"),
    attemptId: id,
    eventId: z.uuid(),
    reason: z.enum(["tab-hidden", "fullscreen-exit"]),
    confirmed: z.literal(true),
  }),
  z.object({
    action: z.literal("order"),
    domainId: id,
    product: z.enum(["certificate", "letter", "bundle"]),
  }),
  z.object({ action: z.literal("sandbox-pay"), orderId: id }),
  z.object({
    action: z.literal("verify-payment"),
    orderId: id,
    razorpay_payment_id: id,
    razorpay_signature: z.string().length(64),
  }),
  z.object({
    action: z.literal("profile"),
    name: z.string().trim().min(2).max(80),
    country: z.string().max(80),
    college: z.string().max(150),
  }),
  z.object({
    action: z.literal("ticket"),
    message: z.string().trim().min(10).max(3000),
  }),
  z.object({ action: z.literal("resolve"), ticketId: id }),
  z.object({
    action: z.literal("domain"),
    domainId: id,
    name: z.string().min(3).max(120),
    description: z.string().min(10).max(1500),
    published: z.boolean(),
    duration: z.number().int().min(5).max(180),
  }),
  z.object({
    action: z.literal("resource"),
    domainId: id,
    title: z.string().min(3).max(150),
    kind: z.enum(["video", "pdf", "reading"]),
    url: z.url().refine((v) => v.startsWith("https://"), "HTTPS URLs only"),
  }),
  z.object({
    action: z.literal("questions"),
    domainId: id,
    questions: z
      .array(
        z.object({
          prompt: z.string().min(10).max(2000),
          topic: z.string().min(2).max(100),
          options: z.array(z.string().min(1).max(500)).length(4),
          correct: z.number().int().min(0).max(3),
          explanation: z.string().min(5).max(2000),
          difficulty: z.enum(["easy", "medium", "hard"]),
        }),
      )
      .min(1)
      .max(100),
    approved: z.literal(true),
  }),
  z.object({ action: z.literal("revoke"), credentialId: id }),
]);
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req))
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const user = await requireUser();
    const body = actions.parse(await req.json());
    const result = await transact(async (s) => {
      sweep(s, sandbox);
      const domain =
        "domainId" in body
          ? s.domains.find((d) => d.id === body.domainId)
          : undefined;
      if ("domainId" in body && !domain) throw new Error("Domain not found");
      const mine = s.enrollments.find(
        (e) => e.userId === user.id && e.domainId === domain?.id,
      );
      if (body.action === "enroll") {
        if (!domain?.published) throw new Error("Domain unavailable");
        if (!mine) {
          const e = {
            id: randomUUID(),
            userId: user.id,
            domainId: domain.id,
            completed: [],
          };
          s.enrollments.push(e);
          audit(s, user.id, "learning.enrolled", e.id);
        }
        return { ok: true };
      }
      if (body.action === "progress") {
        if (!mine) throw new Error("Enroll first");
        const ids = domain!.resources.map((r) => r.id);
        if (!body.bulk && !ids.includes(body.resourceId))
          throw new Error("Unknown resource");
        mine.completed = body.bulk
          ? ids
          : Array.from(new Set([...mine.completed, body.resourceId]));
        mine.method = body.bulk
          ? "bulk acknowledgement"
          : "individual acknowledgement";
        mine.acknowledgedAt = new Date().toISOString();
        mine.policyVersion = POLICY;
        audit(s, user.id, "learning.acknowledged", mine.id, mine.method);
        return { ok: true };
      }
      if (body.action === "start") {
        if (!mine || !domain!.published)
          throw new Error("Enroll in an available domain first");
        const previous = s.attempts.filter(
          (a) => a.userId === user.id && a.domainId === domain!.id,
        );
        const active = previous.find((a) => a.status === "active");
        if (active) return { attemptId: active.id };
        if (previous.length >= 5)
          throw new Error("All five attempts have been used");
        if (previous.some((a) => (a.score || 0) >= 23))
          throw new Error("You have already passed this assessment");
        const bank = s.questions.filter(
          (q) => q.domainId === domain!.id && (q.approved || sandbox),
        );
        const selected: Question[] = [];
        for (const [difficulty, count] of [
          ["easy", 9],
          ["medium", 15],
          ["hard", 6],
        ] as const) {
          const pool = bank.filter((q) => q.difficulty === difficulty);
          if (pool.length < count)
            throw new Error(
              `This assessment needs ${count} reviewed ${difficulty} questions. An administrator must publish its question bank.`,
            );
          selected.push(...shuffle(pool).slice(0, count));
        }
        const questions = shuffle(selected).map((q) => {
          const order = shuffle([0, 1, 2, 3]);
          return {
            ...q,
            options: order.map((i) => q.options[i]),
            correct: order.indexOf(q.correct),
          };
        });
        const now = Date.now();
        const a: Attempt = {
          id: randomUUID(),
          userId: user.id,
          domainId: domain!.id,
          questions,
          startedAt: new Date(now).toISOString(),
          endsAt: new Date(now + domain!.duration * 60000).toISOString(),
          status: "active",
          answers: {},
          violations: [],
          monitoring: body.monitoring,
          consent: {
            version: POLICY,
            at: new Date(now).toISOString(),
            direct: body.direct,
          },
        };
        s.attempts.push(a);
        audit(
          s,
          user.id,
          "exam.started",
          a.id,
          `${body.monitoring}; ${POLICY}`,
        );
        return { attemptId: a.id };
      }
      if ("attemptId" in body) {
        const a = s.attempts.find(
          (a) => a.id === body.attemptId && a.userId === user.id,
        );
        if (!a) throw new Error("Attempt not found");
        if (a.status === "submitted") return { attempt: publicAttempt(a) };
        if (body.action === "answer") {
          if (!a.questions.some((q) => q.id === body.questionId))
            throw new Error("Unknown question");
          if (body.answer === -1) delete a.answers[body.questionId];
          else a.answers[body.questionId] = body.answer;
        }
        if (body.action === "submit") finish(s, a, "manual", sandbox);
        if (body.action === "violation")
          confirmViolation(s, a, body.eventId, body.reason, sandbox);
        return { attempt: publicAttempt(a) };
      }
      if (body.action === "order") {
        if (!mine) throw new Error("Enroll first");
        const already = s.orders.some(
          (o) =>
            o.userId === user.id &&
            o.domainId === domain!.id &&
            o.status === "paid" &&
            (o.product === body.product || o.product === "bundle"),
        );
        if (already)
          throw new Error("You already own this credential entitlement");
        const amount = quote(s, user.id, domain!.id, body.product),
          now = Date.now();
        const order = {
          id: randomUUID(),
          userId: user.id,
          domainId: domain!.id,
          product: body.product,
          amount,
          currency: "INR" as const,
          status: "created" as const,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + 15 * 60000).toISOString(),
          mode: sandbox ? ("sandbox" as const) : ("live" as const),
          providerOrderId: undefined as string | undefined,
        };
        if (!sandbox) {
          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
            throw new Error("Razorpay is not configured");
          const r = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount,
              currency: "INR",
              receipt: order.id,
            }),
          });
          const data = await r.json();
          if (!r.ok)
            throw new Error("Payment provider could not create an order");
          order.providerOrderId = data.id;
        }
        s.orders.push(order);
        audit(s, user.id, "payment.order-created", order.id, `${amount} paise`);
        return { order, keyId: sandbox ? null : process.env.RAZORPAY_KEY_ID };
      }
      if (body.action === "sandbox-pay" || body.action === "verify-payment") {
        const order = s.orders.find(
          (o) => o.id === body.orderId && o.userId === user.id,
        );
        if (!order) throw new Error("Order not found");
        if (order.status === "paid") return { ok: true };
        if (order.status === "review")
          return {
            ok: true,
            message:
              "Payment captured; finance review is required before document issuance. Contact support with your order reference.",
          };
        if (body.action === "sandbox-pay") {
          if (!sandbox || order.mode !== "sandbox")
            throw new Error("Sandbox payment disabled");
          if (Date.now() > Date.parse(order.expiresAt))
            throw new Error("Quote expired; create a new order");
          if (order.amount !== quote(s, user.id, order.domainId, order.product))
            throw new Error(
              "Price changed after the exam started. Create a new order.",
            );
          order.paymentId = `sandbox_${randomUUID()}`;
        } else {
          if (sandbox || !order.providerOrderId)
            throw new Error("Invalid provider order");
          const expected = signature(
            `${order.providerOrderId}|${body.razorpay_payment_id}`,
            process.env.RAZORPAY_KEY_SECRET!,
          );
          if (!safeEqual(expected, body.razorpay_signature))
            throw new Error("Payment signature mismatch");
          const r = await fetch(
            `https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
              },
            },
          );
          const payment = await r.json();
          if (
            !r.ok ||
            payment.status !== "captured" ||
            payment.order_id !== order.providerOrderId ||
            payment.amount !== order.amount ||
            payment.currency !== "INR"
          )
            throw new Error("Payment capture is not verified yet");
          const status = capturedPayment(s, order, payment.id, Date.now());
          return {
            ok: true,
            message:
              status === "review"
                ? "Payment captured outside the quoted conditions. Finance review is required; contact support."
                : "Payment verified.",
          };
        }
        order.status = "paid";
        order.paidAt = new Date().toISOString();
        audit(s, user.id, "payment.verified", order.id);
        issue(s, user.id, order.domainId, sandbox);
        return { ok: true };
      }
      if (body.action === "profile") {
        const u = s.users.find((u) => u.id === user.id)!;
        if (
          s.credentials.some((c) => c.userId === user.id) &&
          u.name !== body.name
        )
          throw new Error(
            "Request a name correction through support after credential issuance",
          );
        Object.assign(u, {
          name: body.name,
          country: body.country,
          college: body.college,
        });
        audit(s, user.id, "profile.updated", u.id);
        return { ok: true };
      }
      if (body.action === "ticket") {
        s.tickets.push({
          id: randomUUID(),
          userId: user.id,
          message: body.message,
          status: "open",
          at: new Date().toISOString(),
        });
        return { ok: true };
      }
      if (body.action === "resolve") {
        permit(user, "support");
        const t = s.tickets.find((t) => t.id === body.ticketId);
        if (!t) throw new Error("Ticket not found");
        t.status = "resolved";
        audit(s, user.id, "support.resolved", t.id);
        return { ok: true };
      }
      if (body.action === "domain") {
        permit(user, "content");
        Object.assign(domain!, {
          name: body.name,
          description: body.description,
          published: body.published,
          duration: body.duration,
        });
        audit(s, user.id, "domain.updated", domain!.id);
        return { ok: true };
      }
      if (body.action === "resource") {
        permit(user, "content");
        domain!.resources.push({
          id: randomUUID(),
          title: body.title,
          kind: body.kind,
          url: body.url,
        });
        audit(s, user.id, "resource.added", domain!.id);
        return { ok: true };
      }
      if (body.action === "questions") {
        permit(user, "exams");
        for (const q of body.questions) {
          if (new Set(q.options).size !== 4)
            throw new Error("Options must be distinct");
          if (
            s.questions.some(
              (existing) =>
                existing.domainId === domain!.id &&
                existing.prompt.trim().toLowerCase() ===
                  q.prompt.trim().toLowerCase(),
            )
          )
            throw new Error("Duplicate question detected");
          s.questions.push({
            ...q,
            id: randomUUID(),
            domainId: domain!.id,
            approved: true,
          });
        }
        audit(
          s,
          user.id,
          "questions.reviewed-and-published",
          domain!.id,
          `${body.questions.length} questions`,
        );
        return { ok: true };
      }
      if (body.action === "revoke") {
        permit(user, "settings");
        const c = s.credentials.find((c) => c.id === body.credentialId);
        if (!c) throw new Error("Credential not found");
        c.revoked = true;
        audit(s, user.id, "credential.revoked", c.id);
        return { ok: true };
      }
      throw new Error("Unsupported operation");
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Please check the form values"
            : e instanceof Error
              ? e.message
              : "Request failed",
      },
      { status: 400 },
    );
  }
}
