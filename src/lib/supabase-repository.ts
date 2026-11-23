import "server-only";
import { createClient } from "@supabase/supabase-js";
import { stateChanges } from "./relational";
import type { State } from "./types";
export async function supabaseTransaction<T>(
  fn: (state: State) => T | Promise<T>,
): Promise<T> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.rpc("portal_read_state");
  if (error)
    throw new Error(
      "The secure database connection is not ready. Check the server key and applied migrations.",
    );
  const state = data.state as State,
    before = structuredClone(state);
  const result = await fn(state),
    changes = stateChanges(before, state);
  if (Object.keys(changes).length) {
    const { error: writeError } = await client.rpc("portal_write_changes", {
      expected_version: data.version,
      changes,
    });
    if (writeError) {
      if (writeError.message.includes("PORTAL_CONCURRENT_UPDATE"))
        throw new Error(
          "Another update finished at the same time. Please try this action again.",
        );
      throw new Error(
        "The database could not save this action. Please try again or contact support.",
      );
    }
  }
  return result;
}
