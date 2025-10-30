#!/usr/bin/env node
import fs from 'fs';
import transpile from 'acsv-transpiler';

const [src, dest] = process.argv.slice(2);

function usage() {
  console.error('Usage: node cli-test.mjs <src.acsv> <dest.csv>');
  process.exit(1);
}

if (!src || !dest) usage();

try {
  const input = fs.readFileSync(src, 'utf8');
  const csv = transpile({ input, streaming: false, stats: false });
  fs.writeFileSync(dest, csv, 'utf8');
  console.log(`Wrote ${dest}`);
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}
