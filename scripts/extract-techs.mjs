// Extract the unique set of tech tokens from the seed file.
import fs from "node:fs";
const sql = fs.readFileSync(
  "supabase/migrations/20260627190500_seed_internships.sql",
  "utf8",
);
const arrRe = /'\[((?:[^']|'')*)\]'::jsonb/g;
const set = new Set();
for (const m of sql.matchAll(arrRe)) {
  const inner = m[1].replace(/''/g, "'");
  const items = JSON.parse(inner);
  for (const x of items) set.add(x);
}
const all = [...set].sort();
console.log("Unique strings in any array column:", all.length);
console.log(all.join("\n"));