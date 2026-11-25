/**
 * Apply db/schema.sql to Neon using DATABASE_URL.
 * Usage: npm run db:schema
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const raw = readFileSync(resolve(__dirname, "../.env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch {
  /* optional */
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sqlText = readFileSync(resolve(__dirname, "../db/schema.sql"), "utf8");
const parts = [];
let buf = "";
let inDo = false;
for (const line of sqlText.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("--") && !inDo) continue;
  if (/^do\s+\$\$/i.test(trimmed)) inDo = true;
  buf += `${line}\n`;
  if (inDo && /end\s+\$\$\s*;/i.test(trimmed)) {
    inDo = false;
    parts.push(buf.trim());
    buf = "";
    continue;
  }
  if (!inDo && trimmed.endsWith(";")) {
    parts.push(buf.trim());
    buf = "";
  }
}
if (buf.trim()) parts.push(buf.trim());

const sql = neon(url);
let ok = 0;
let fail = 0;
for (const stmt of parts) {
  if (!stmt || stmt === ";") continue;
  try {
    await sql.query(stmt);
    ok += 1;
  } catch (e) {
    fail += 1;
    const message = e instanceof Error ? e.message : String(e);
    // ignore already-exists noise
    if (!/already exists|duplicate/i.test(message)) {
      console.warn("warn:", message.slice(0, 160));
    }
  }
}

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;
console.log(`Applied/ok≈${ok}, soft-fail≈${fail}`);
console.log(
  "public tables:",
  tables.map((t) => t.table_name).join(", ") || "(none)",
);
console.log("Next: npm run db:migrate");
