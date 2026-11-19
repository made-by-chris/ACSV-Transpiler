import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { compile, toRecords, validate } from "../../dist/ACSVTranspiler.js";
import { authoringGuide } from "../../src/authoringGuide.ts";
const vectors = JSON.parse(
  readFileSync(new URL("./vectors.json", import.meta.url), "utf8"),
);
for (const vector of vectors)
  test(`portable vector: ${vector.name}`, () => {
    if (vector.error)
      expect(validate({ input: vector.input, mode: "acsv" })).toMatchObject({
        valid: false,
        diagnostics: [{ code: vector.error }],
      });
    else {
      const result = compile({ input: vector.input, mode: "acsv" });
      expect(result.csv).toBe(vector.csv);
      expect(toRecords(result)).toEqual(vector.records);
    }
  });
test("the authoring guide contains an executable example", () => {
  const input = authoringGuide.split("Example:\n")[1].split("\n\nOrdinary CSV")[0];
  expect(toRecords(compile({ input, mode: "acsv" }))).toEqual(
    vectors[0].records,
  );
});
