/**
 * One-off helper: node generate-rasp-quiz-sql.mjs >> ../sql/seed_course_rasp.sql (append quiz block)
 * Or run and paste output into seed file.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  join(__dirname, '../../Frontend/src/data/courseTopicQuizData.ts'),
  'utf8'
);
const start = src.indexOf('rasp:');
if (start === -1) throw new Error('rasp: not found');
const open = src.indexOf('[', start);
let depth = 0;
let end = open;
for (; end < src.length; end++) {
  const c = src[end];
  if (c === '[') depth++;
  else if (c === ']') {
    depth--;
    if (depth === 0) {
      end++;
      break;
    }
  }
}
const block = src.slice(open + 1, end - 1);
const objs = [];
const re =
  /\{\s*question:\s*'((?:\\'|[^'])*)',\s*options:\s*\[([\s\S]*?)\],\s*correctIndex:\s*(\d+),?\s*\}/g;
let mm;
while ((mm = re.exec(block)) !== null) {
  const q = mm[1].replace(/\\'/g, "'");
  const optStr = mm[2];
  const opts = [];
  const ore = /'((?:\\'|[^'])*)'/g;
  let om;
  while ((om = ore.exec(optStr)) !== null) opts.push(om[1].replace(/\\'/g, "'"));
  if (opts.length !== 4) throw new Error(`Expected 4 options, got ${opts.length} for Q: ${q.slice(0, 40)}`);
  objs.push({ q, opts, ci: Number(mm[3]) });
}
function sqlStr(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}
function jsonArr(opts) {
  return 'JSON_ARRAY(' + opts.map(sqlStr).join(', ') + ')';
}
let sort = 0;
const valueLines = [];
for (const { q, opts, ci } of objs) {
  valueLines.push(
    `  (@rasp_topic_id, ${sqlStr(q)}, ${jsonArr(opts)}, ${ci}, ${sort++})`
  );
}
const outPath = join(__dirname, '../sql/_rasp_quiz_values.sqlpart');
writeFileSync(outPath, `${valueLines.join(',\n')}\n`, 'utf8');
console.error(`-- Wrote ${objs.length} quiz value lines to ${outPath}`);
