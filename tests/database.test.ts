import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { seed, questions } from "../src/lib/catalog";
import { finish } from "../src/lib/engine";
import type { Attempt } from "../src/lib/types";
test("normalized PostgreSQL schema, ownership policies, constraints and round-trip persistence", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}');
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;`);
    await db.exec(
      await fs.readFile(
        "supabase/migrations/20261123191541_normalized_course_portal.sql",
        "utf8",
      ),
    );
    await db.exec(
      await fs.readFile(
        "supabase/migrations/20261123193215_server_repository_rpc.sql",
        "utf8",
      ),
    );
    const one = randomUUID(),
      two = randomUUID();
    await db.exec(await fs.readFile('supabase/migrations/20261123193952_protect_profile_roles.sql','utf8'));
    await db.query(
      `insert into auth.users(id,email,raw_user_meta_data) values($1,'one@example.invalid','{"full_name":"One","role":"admin"}'),($2,'two@example.invalid','{"full_name":"Two"}')`,
      [one, two],
    );
    const profiles = await db.query<{ id: string; role: string }>(
      "select id,role from public.profiles order by id",
    );
    assert.ok(
      profiles.rows.every((u) => u.role === "user"),
      "user metadata cannot create an admin",
    );
    const state = seed();
    state.users = [
      { id: one, name: "One", email: "one@example.invalid", role: "user" },
      { id: two, name: "Two", email: "two@example.invalid", role: "user" },
    ];
    state.questions = questions.map((q) => ({ ...q, approved: true }));
    const enrollment = {
      id: randomUUID(),
      userId: one,
      domainId: "python",
      completed: [],
    };
    state.enrollments.push(enrollment);
    const a: Attempt = {
      id: randomUUID(),
      userId: one,
      domainId: "python",
      startedAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 60000).toISOString(),
      status: "active",
      questions: structuredClone(state.questions),
      answers: {},
      violations: [],
      monitoring: "standard",
      consent: { version: "test", at: new Date().toISOString(), direct: true },
    };
    state.attempts.push(a);
    for (const q of a.questions.slice(0, 23)) a.answers[q.id] = q.correct;
    await db.query("select portal_private.persist_changes($1::jsonb)", [
      JSON.stringify(state),
    ]);
    const roundtrip = await db.query<{ state: typeof state }>(
      "select portal_private.load_state() as state",
    );
    assert.equal(roundtrip.rows[0].state.attempts[0].questions.length, 30);
    assert.equal(
      Object.keys(roundtrip.rows[0].state.attempts[0].answers).length,
      23,
    );
    assert.equal(roundtrip.rows[0].state.domains.length, 12);
    await db.query("update public.profiles set role='admin' where id=$1",[one]);
    await db.query('select portal_private.persist_changes($1::jsonb)',[JSON.stringify({users:state.users})]);
    assert.equal((await db.query<{role:string}>('select role from public.profiles where id=$1',[one])).rows[0].role,'admin','profile editing cannot overwrite owner-assigned roles');
    finish(state, a, "manual", true);
    await db.query("select portal_private.persist_changes($1::jsonb)", [
      JSON.stringify({ attempts: state.attempts, audit: state.audit }),
    ]);
    assert.equal(
      (
        await db.query<{ score: number }>(
          "select score from public.exam_attempts",
        )
      ).rows[0].score,
      23,
    );
    await assert.rejects(
      db.query(
        `insert into public.enrollments(id,user_id,domain_id) values($1,$2,'python')`,
        [randomUUID(), one],
      ),
      /unique/i,
    );
    await assert.rejects(
      db.query(
        `update public.profiles set role='content_manager' where id=$1`,
        [one],
      ),
      /check constraint/i,
    );
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='${two}';`,
    );
    assert.equal(
      (await db.query("select * from public.exam_attempts")).rows.length,
      0,
      "another user cannot read an attempt",
    );
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      1,
      "profiles are owned",
    );
    await assert.rejects(
      db.query("select * from portal_private.questions"),
      /permission denied/i,
    );
    await assert.rejects(
      db.query(`update public.profiles set role='admin' where id=$1`, [two]),
      /permission denied/i,
    );
    await assert.rejects(
      db.query(`select portal_private.load_state()`),
      /permission denied/i,
    );
    await assert.rejects(
      db.query(`select public.portal_read_state()`),
      /permission denied/i,
    );
    await db.exec("reset role");
    const versioned = await db.query<{ state: { version: number } }>(
      "select public.portal_read_state() as state",
    );
    await db.query("select public.portal_write_changes($1,$2::jsonb)", [
      versioned.rows[0].state.version,
      "{}",
    ]);
    await assert.rejects(
      db.query("select public.portal_write_changes($1,$2::jsonb)", [
        versioned.rows[0].state.version,
        "{}",
      ]),
      /PORTAL_CONCURRENT_UPDATE/,
    );
    const exposed = await db.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      `select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`,
    );
    assert.ok(exposed.rows.every((t) => t.relrowsecurity));
  } finally {
    await db.close();
  }
});
