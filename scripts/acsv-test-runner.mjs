import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import transpile from '../dist/ACSVTranspiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const testsDir = path.join(root, 'tests');

function findTests(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findTests(p);
    return [];
  }).filter(() => true);
}

function* testCases() {
  const groups = fs.readdirSync(testsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const g of groups) {
    const dir = path.join(testsDir, g.name);
    const input = path.join(dir, 'input.acsv');
    const expected = path.join(dir, 'expected.csv');
    if (fs.existsSync(input) && fs.existsSync(expected)) {
      yield { id: g.name, input, expected };
    }
  }
}

let failed = 0, passed = 0;
for (const t of testCases()) {
  const input = fs.readFileSync(t.input, 'utf8');
  const want = fs.readFileSync(t.expected, 'utf8').trim();
  const got = transpile({ input, streaming: false, stats: false }).trim();
  if (got === want) {
    console.log(`PASS  ${t.id}`);
    passed++;
  } else {
    console.error(`FAIL  ${t.id}`);
    console.error('--- got ---');
    console.error(got);
    console.error('--- want ---');
    console.error(want);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
