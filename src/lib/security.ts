import type { NextRequest } from "next/server";
export function validOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const origin = req.headers.get("origin");
  const allowed = new Set([new URL(configured).origin]);
  if (process.env.APP_MODE !== "live") {
    const port = new URL(configured).port || "3000";
    allowed.add(`http://127.0.0.1:${port}`);
    allowed.add(`http://localhost:${port}`);
  }
  return !!origin && allowed.has(origin);
}
