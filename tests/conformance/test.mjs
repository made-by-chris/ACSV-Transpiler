import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { compile, toRecords, validate } from "../../dist/ZROWCompiler.js";
import { authoringGuide } from "../../src/authoringGuide.ts";
const vectors = JSON.parse(
  readFileSync(new URL("./vectors.json", import.meta.url), "utf8"),
);
for (const vector of vectors)
  test(`portable vector: ${vector.name}`, () => {
    if (vector.error)
      expect(validate({ input: vector.input, mode: "zrow" })).toMatchObject({
        valid: false,
        diagnostics: [{ code: vector.error }],
      });
    else {
      const result = compile({ input: vector.input, mode: "zrow" });
      expect(result.csv).toBe(vector.csv);
      expect(toRecords(result)).toEqual(vector.records);
    }
  });
test("the authoring guide contains an executable example", () => {
  const input = authoringGuide.split("Example:\n")[1].split("\n\n")[0];
  expect(toRecords(compile({ input, mode: "zrow" }))).toEqual([
    { id: 1, name: "User 1", role: "member" },
    { id: 2, name: "User 2", role: "member" },
    { id: 3, name: "Shelley, Chris", role: "admin" },
  ]);
});
