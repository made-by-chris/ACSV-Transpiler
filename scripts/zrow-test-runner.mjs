import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import transpileNode from "../dist/node.js";

const testsDir = fileURLToPath(new URL("../tests/", import.meta.url));
let passed = 0,
  failed = 0;
for (const entry of fs.readdirSync(testsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(testsDir, entry.name);
  const inputFile = path.join(dir, "input.zrow"),
    expectedFile = path.join(dir, "expected.csv");
  if (!fs.existsSync(inputFile) || !fs.existsSync(expectedFile)) continue;
  try {
    const expected = fs
      .readFileSync(expectedFile, "utf8")
      .replace(/\r?\n$/, "");
    const actual = transpileNode({
      input: fs.readFileSync(inputFile, "utf8"),
      mode: "zrow",
      baseDir: dir,
    });
    if (actual !== expected)
      throw new Error(
        `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
      );
    console.log(`PASS ${entry.name}`);
    passed++;
  } catch (error) {
    console.error(`FAIL ${entry.name}: ${error.message}`);
    failed++;
  }
}
console.log(
  `${passed} golden fixtures passed, ${failed} failed. Full API and compatibility coverage: npm test.`,
);
process.exitCode = failed ? 1 : 0;
