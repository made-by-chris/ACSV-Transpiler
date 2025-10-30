import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import transpile from '../dist/ACSVTranspiler.js';

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

export function getActualExpected(dirUrl) {
  const dir = fileURLToPath(dirUrl);
  const input = fs.readFileSync(path.join(dir, 'input.acsv'), 'utf8');
  const expectedRaw = fs.readFileSync(path.join(dir, 'expected.csv'), 'utf8');
  const actualRaw = transpile({ input, streaming: false, stats: false, baseDir: dir });
  const expected = normalizeNewlines(expectedRaw);
  const actual = normalizeNewlines(actualRaw);
  return { actual, expected };
}
