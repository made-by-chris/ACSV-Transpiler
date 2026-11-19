import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { compile } from "../../dist/ZROWCompiler.js";
test("all documented recipe/output pairs compile exactly as shown", () => {
  let count = 0;
  for (const file of ["examples.md", "docs/core.md"]) {
    const markdown = readFileSync(
      new URL(`../../${file}`, import.meta.url),
      "utf8",
    );
    for (const match of markdown.matchAll(
      /```zrow\n([\s\S]*?)\n```\s*```csv\n([\s\S]*?)\n```/g,
    )) {
      expect(
        compile({ input: match[1], mode: "zrow" }).csv,
        `${file} example ${count + 1}`,
      ).toBe(match[2]);
      count++;
    }
  }
  expect(count).toBeGreaterThanOrEqual(3);
});
