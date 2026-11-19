import { test, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { compile, serializeJSON } from "../../dist/ZROWCompiler.js";
import { compileNode } from "../../dist/node.js";
import { examples } from "../../src/examples.ts";
const snippets = JSON.parse(
  readFileSync(
    new URL("../../content/integrations.json", import.meta.url),
    "utf8",
  ),
);
test("all onboarding recipes use the current language and notation", () => {
  for (const example of examples.filter((e) => e.mode === "zrow")) {
    expect(example.source, example.id).toMatch(/^# ZROW 0\.3\n/);
    expect(example.source, example.id).not.toMatch(/^@/m);
    expect(
      compile({ input: example.source, mode: "zrow" }).rows.length,
    ).toBeGreaterThan(0);
  }
});
test("feature examples cover supported constructs and expression helpers", () => {
  const ids = new Set(
    examples.filter((e) => e.kind === "feature").map((e) => e.id),
  );
  for (const name of [
    "cols",
    "enum",
    "row",
    "rows",
    "with",
    "expect",
    "unique",
    "seed",
    "time",
    "seq",
    "cycle",
    "rand",
    "randFloat",
    "randInt",
    "normal",
    "choice",
    "choiceWeighted",
    "latitude",
    "longitude",
    "today",
    "now",
    "tomorrow",
    "yesterday",
    "round",
    "min",
    "max",
    "clamp",
    "pow",
    "if",
    "prev",
    "pad",
    "formatDate",
  ])
    expect(ids.has("feature-" + name), name).toBe(true);
});
test("JavaScript integration code executes with the public exports", () => {
  const code = snippets
    .find((s) => s.id === "javascript")
    .code.replace(/^import[^\n]+\n/, "");
  const logs = [];
  new Function("compile", "serializeJSON", "console", code)(
    compile,
    serializeJSON,
    { log: (value) => logs.push(value) },
  );
  expect(logs[0]).toBe("id,name\n1,User 1\n2,User 2\n3,User 3");
  expect(JSON.parse(logs[1])).toHaveLength(3);
});
test("Node integration code compiles an on-disk recipe", () => {
  const dir = mkdtempSync(join(tmpdir(), "zrow-integration-"));
  try {
    writeFileSync(
      join(dir, "users.zrow"),
      '# ZROW 0.3\n(cols id:int,name)\n(id=seq(),name="User {id}")\n(rows 3)',
    );
    const code = snippets
      .find((s) => s.id === "node")
      .code.replace(
        "'zrow-js/node'",
        JSON.stringify(new URL("../../dist/node.js", import.meta.url).href),
      );
    execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: dir,
    });
    expect(readFileSync(join(dir, "users.csv"), "utf8")).toContain("3,User 3");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("HTTP tab contains a valid request body using the same recipe", () => {
  const code = snippets.find((s) => s.id === "http").code;
  const request = JSON.parse(code.match(/--data '([\s\S]+)'$/)[1]);
  expect(JSON.parse(serializeJSON(compile(request)))).toHaveLength(3);
  expect(request.format).toBe("json");
});
