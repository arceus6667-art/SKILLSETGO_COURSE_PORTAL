import fs from "node:fs/promises";
const config = Object.fromEntries(
  (await fs.readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
const root = config.NEXT_PUBLIC_SUPABASE_URL,
  key = config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const domains = await fetch(
  root + "/rest/v1/domains?select=id,name,published",
  { headers },
);
const data = await domains.json();
const auth = await fetch(root + "/auth/v1/settings", {
  headers: { apikey: key },
});
const settings = await auth.json();
const privateRead = await fetch(root + "/rest/v1/rpc/portal_read_state", {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: "{}",
});
const result = {
  project: new URL(root).hostname.split(".")[0],
  publicDomainsStatus: domains.status,
  publishedDomains: Array.isArray(data)
    ? data.filter((d) => d.published).length
    : null,
  googleEnabled: settings.external?.google === true,
  emailEnabled: settings.external?.email === true,
  privilegedRpcBlocked: !privateRead.ok,
};
console.log(JSON.stringify(result, null, 2));
if (
  result.publicDomainsStatus !== 200 ||
  result.publishedDomains !== 12 ||
  !result.privilegedRpcBlocked
)
  process.exitCode = 1;
