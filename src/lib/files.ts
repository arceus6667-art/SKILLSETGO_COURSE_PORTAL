import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { sandbox } from "./store";
import { serviceClient, supabaseAuth } from "./auth";
export async function readFile(key: string) {
  if (!/^[a-z0-9-]+\.(pdf|png)$/.test(key)) throw new Error("Invalid file");
  if (sandbox)
    return fs.readFile(path.join(process.cwd(), ".data", "uploads", key));
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? serviceClient()
    : await supabaseAuth();
  const { data, error } = await client.storage
    .from("skillset-private")
    .download(key);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
export async function writeFile(
  key: string,
  bytes: Buffer,
  contentType: string,
) {
  if (sandbox) {
    const dir = path.join(process.cwd(), ".data", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, key), bytes);
    return;
  }
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? serviceClient()
    : await supabaseAuth();
  const { error } = await client.storage
    .from("skillset-private")
    .upload(key, bytes, { contentType, upsert: false });
  if (error) throw error;
}
