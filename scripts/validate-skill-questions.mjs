// Validate the generated seed SQL by parsing every row's literal fields.
// Mirrors how PostgreSQL would parse each `VALUES (...)` row: split on
// commas that are not inside a quoted string, then unescape each field.
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "F:/AIProjects/skilltern-v2/supabase/migrations/20260627195500_seed_skill_questions.sql",
  "utf8",
);

// Split into the per-row tuple lines we emitted.
const lines = sql.split("\n").filter((l) => l.startsWith("  ( "));
console.log("Total row lines:", lines.length);

function splitTopLevel(s) {
  // Splits on commas not inside single-quoted strings.
  const parts = [];
  let buf = "";
  let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") {
      buf += c;
      if (s[i + 1] === "'") { buf += "'"; i++; continue; }
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) { parts.push(buf); buf = ""; continue; }
    buf += c;
  }
  if (buf.length) parts.push(buf);
  return parts.map((p) => p.trim());
}

function unquote(s) {
  // Strips surrounding '...' and un-escapes ''.
  if (!s.startsWith("'")) throw new Error("not a quoted string: " + s);
  // For JSONB literals the trailing ' was already eaten by the
  // `::jsonb` cast — handle that case.
  const inner = s.endsWith("'") ? s.slice(1, -1) : s.slice(1);
  return inner.replace(/''/g, "'");
}

const bySkill = {};
const diffCount = { Easy: 0, Medium: 0, Hard: 0 };
let bad = 0;
const diffSet = new Set(["Easy", "Medium", "Hard"]);

for (const line of lines) {
  // Trim the wrapping "  ( " prefix and " )" or " )," suffix.
  let trimmed = line;
  trimmed = trimmed.replace(/^\s*\(\s*/, "");
  trimmed = trimmed.replace(/\s*\)\s*,?\s*;?\s*$/, "");
  const parts = splitTopLevel(trimmed);
  if (parts.length !== 6) { bad++; console.log("field count != 6:", line.slice(0, 100)); continue; }

  const [skillRaw, qRaw, optsRaw, ansRaw, explRaw, diffRaw] = parts;

  const skill = unquote(skillRaw);
  const question = unquote(qRaw);
  const ansIdx = parseInt(ansRaw, 10);
  const explanation = unquote(explRaw);
  const difficulty = unquote(diffRaw);

  // Options: strip the trailing ::jsonb cast, then unwrap.
  const optsStr = optsRaw.replace(/'::jsonb\s*$/, "").trim();
  let opts;
  try { opts = JSON.parse(unquote(optsStr)); } catch (e) { bad++; console.log("options json error:", e.message, optsStr); continue; }

  if (!Array.isArray(opts) || opts.length !== 4) { bad++; console.log("opts not 4:", opts); continue; }
  for (const o of opts) {
    if (typeof o !== "string" || !o.length) { bad++; console.log("opt not string:", o); break; }
  }
  if (!Number.isInteger(ansIdx) || ansIdx < 0 || ansIdx > 3) { bad++; console.log("bad ans idx:", ansIdx); continue; }
  if (!diffSet.has(difficulty)) { bad++; console.log("bad diff:", difficulty); continue; }
  if (typeof question !== "string" || !question.length) { bad++; console.log("empty q"); continue; }
  if (typeof explanation !== "string") { bad++; console.log("bad expl"); continue; }

  bySkill[skill] = (bySkill[skill] || 0) + 1;
  diffCount[difficulty]++;
}

console.log("\nSkills:", Object.keys(bySkill).length);
const allTen = Object.entries(bySkill).every(([, n]) => n === 10);
console.log("All skills have 10 rows:", allTen);
for (const [s, n] of Object.entries(bySkill).sort()) {
  console.log("  " + s.padEnd(18) + n);
}
console.log("\nDifficulty:", diffCount);
console.log("\nBad rows:", bad);