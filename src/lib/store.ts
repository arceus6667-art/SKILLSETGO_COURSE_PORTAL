import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { seed } from "./catalog";
import type { State } from "./types";
import { stateChanges } from "./relational";
import { supabaseTransaction } from "./supabase-repository";
export const sandbox = process.env.APP_MODE !== "live";
export function assertEnvironment() {
  if(!sandbox&&process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('sb_publishable_'))throw new Error('Use a private server key for the protected backend, not a publishable key.');
  if (sandbox && process.env.VERCEL)
    throw new Error("Sandbox cannot run on Vercel. Configure live services.");
  if (!sandbox)
    for (const key of [
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "CREDENTIAL_SECRET",
    ])
      if (!process.env[key])
        throw new Error(`Missing live configuration: ${key}`);
  if (!sandbox && (process.env.CREDENTIAL_SECRET?.length || 0) < 32)
    throw new Error(
      "CREDENTIAL_SECRET must contain at least 32 random characters",
    );
  if (
    !sandbox &&
    !process.env.DATABASE_URL &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error(
      "Add a private Supabase server key or database connection before opening the live workspace.",
    );
}
// Next may bundle a repository module separately for different route handlers.
// Share the LOCAL-only serialization queue across those bundles and HMR reloads.
const sandboxRuntime = globalThis as typeof globalThis & {
  sgSandboxQueue?: Promise<unknown>;
};
let sql: ReturnType<typeof postgres> | undefined;
const file = path.join(process.cwd(), ".data", "sandbox.json");
export async function transact<T>(
  fn: (state: State) => T | Promise<T>,
): Promise<T> {
  assertEnvironment();
  if (!sandbox) {
    if (!process.env.DATABASE_URL) return supabaseTransaction(fn);
    sql ??= postgres(process.env.DATABASE_URL!, {
      prepare: false,
      max: 5,
      ssl: "require",
    });
    const result = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(72418031)`;
      const rows = await tx`select portal_private.load_state() as state`;
      const state = rows[0].state as State;
      const before = structuredClone(state);
      const result = await fn(state);
      const changes = stateChanges(before, state);
      if (Object.keys(changes).length) {
        await tx`select portal_private.persist_changes(${tx.json(changes)})`;
        await tx`update portal_private.repository_version set version=version+1 where id=1`;
      }
      return result;
    });
    return result as T;
  }
  const work = (sandboxRuntime.sgSandboxQueue || Promise.resolve()).then(
    async () => {
      let state: State;
      let existed = true;
      try {
        state = JSON.parse(await fs.readFile(file, "utf8"));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        state = seed();
        existed = false;
      }
      const before = JSON.stringify(state);
      const result = await fn(state);
      const after = JSON.stringify(state);
      if (existed && before === after) return result;
      await fs.mkdir(path.dirname(file), { recursive: true });
      const temporary = `${file}.${randomUUID()}.tmp`;
      await fs.writeFile(temporary, after);
      for (let retry = 0; ; retry++) {
        try {
          await fs.rename(temporary, file);
          break;
        } catch (e) {
          const code = (e as NodeJS.ErrnoException).code;
          if (retry >= 5 || !["EPERM", "EACCES", "EBUSY"].includes(code || ""))
            throw e;
          await new Promise((resolve) => setTimeout(resolve, 25 * (retry + 1)));
        }
      }
      return result;
    },
  );
  sandboxRuntime.sgSandboxQueue = work.catch(() => {});
  return work;
}
