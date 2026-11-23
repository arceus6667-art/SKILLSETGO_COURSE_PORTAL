import fs from "node:fs/promises";
import { domains } from "../src/lib/catalog";
const json = JSON.stringify({ domains }).replaceAll("'", "''");
await fs.mkdir("supabase", { recursive: true });
await fs.writeFile(
  "supabase/seed.sql",
  `-- Initial domain catalogue. No demo users, payments, or unreviewed questions.\nselect portal_private.persist_changes('${json}'::jsonb);\n`,
);
console.log("Domain seed prepared");
