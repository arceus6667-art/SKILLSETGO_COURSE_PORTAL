import "server-only";
import type { State } from "./types";
export function stateChanges(before: State, after: State): Partial<State> {
  const changes: Record<string, unknown> = {};
  for (const key of [
    "users",
    "domains",
    "questions",
    "enrollments",
    "attempts",
    "orders",
    "credentials",
    "audit",
    "tickets",
  ] as const) {
    const old = new Map(
      before[key].map((row) => [row.id, JSON.stringify(row)]),
    );
    const changed = after[key].filter(
      (row) => old.get(row.id) !== JSON.stringify(row),
    );
    if (changed.length) changes[key] = changed;
  }
  const added = after.webhooks.filter((id) => !before.webhooks.includes(id));
  if (added.length) changes.webhooks = added;
  if (JSON.stringify(before.settings) !== JSON.stringify(after.settings))
    changes.settings = after.settings;
  return changes as Partial<State>;
}
