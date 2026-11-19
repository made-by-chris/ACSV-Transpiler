import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import transpileNode from "../../dist/node.js";
import example, { examples } from "../../src/exampleACSV.ts";
import { compile } from "../../dist/ACSVTranspiler.js";

// Native ESM avoids the __dirname wrapper injected by the test runner.
function withoutProcess(input) {
  const script = `
    import transpile from ${JSON.stringify(new URL("../../dist/ACSVTranspiler.js", import.meta.url).href)};
    const input = process.argv[1];
    globalThis.process = undefined;
    try {
      console.log(JSON.stringify({ output: transpile({ input, mode:'acsv', streaming: false, stats: false }) }));
    } catch (error) {
      console.log(JSON.stringify({ error: error.message }));
    }
  `;
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      ["--input-type=module", "-e", script, input],
      { encoding: "utf8" },
    ),
  );
  if (result.error) throw new Error(result.error);
  return result.output;
}

test("plain CSV works without Node globals", () => {
  const input = "id,name\n1,Alice\n2,Bob";
  const output = withoutProcess(input);
  expect(output.trim()).toBe(input);
});

test("explicit ACSV controls work without Node globals", () => {
  const output = withoutProcess("id,name\n> id++,name=Alice\n,\n,");
  expect(output.trim()).toBe("id,name\n1,Alice\n2,Alice");
});

test("file includes explain the browser limitation", () => {
  expect(() => withoutProcess('id,name\ninclude "common.acsv"')).toThrow(
    "File includes require the Node.js adapter",
  );
});

test("Node file includes still resolve relative to baseDir", () => {
  const dir = mkdtempSync(join(tmpdir(), "acsv-include-"));
  try {
    writeFileSync(join(dir, "common.acsv"), "id,name\n1,Alice\n2,Bob");
    const output = transpileNode({
      mode: "acsv",
      input: 'id,name\ninclude "common.acsv"',
      baseDir: dir,
      streaming: false,
      stats: false,
    });
    expect(output.trim()).toBe("id,name\n1,Alice\n2,Bob");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("control assignments do not emit rows, including with empty input", () => {
  expect(withoutProcess("id,name\n> name=Alice").trim()).toBe("id,name");
  expect(withoutProcess("id,name\n> name=Alice\n1,\n2,").trim()).toBe(
    "id,name\n1,Alice\n2,Alice",
  );
  expect(withoutProcess("")).toBe("");
});

test("the default app fixture produces typed users and explicit edge cases", () => {
  const output = withoutProcess(example);
  expect(output).toContain("20,user20@example.test,reviewer,true");
  expect(output).toContain("21,admin@example.test,admin,true");
  expect(output).toContain("22,user22@example.test,guest,false");
  expect(output).toContain("25,,guest,true");
  expect(output.split("\n")).toHaveLength(26);
});

test("includes reject cycles and paths outside the selected directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "acsv-bounds-"));
  const outside = mkdtempSync(join(tmpdir(), "acsv-outside-"));
  try {
    writeFileSync(join(dir, "loop.acsv"), 'id\ninclude "loop.acsv"');
    writeFileSync(join(outside, "secret.acsv"), "id\n42");
    expect(() =>
      transpileNode({
        input: 'id\ninclude "loop.acsv"',
        mode: "acsv",
        baseDir: dir,
      }),
    ).toThrow("Circular include");
    expect(() =>
      transpileNode({
        input: `id\ninclude "${join(outside, "secret.acsv")}"`,
        mode: "acsv",
        baseDir: dir,
      }),
    ).toThrow("Includes must stay inside");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("game example keeps the boss override and resumes the formula curve", () => {
  const result = compile({ input: examples.find(example => example.id === "game-progression").source, mode: examples.find(example => example.id === "game-progression").mode });
  expect(result.rows).toHaveLength(24);
  expect(result.rows[0]).toEqual(["1", "slime", "80", "8", "25"]);
  expect(result.rows[20]).toEqual(["21", "guardian", "1500", "80", "525"]);
  expect(result.rows[21]).toEqual(["22", "elite", "864", "71", "550"]);
});

test("literal editor example is unchanged and retains multiline values", () => {
  const result = compile({ input: examples.find(example => example.id === "literal-csv").source, mode: examples.find(example => example.id === "literal-csv").mode });
  expect(result.csv).toBe(examples.find(example => example.id === "literal-csv").source);
  expect(result.rows.at(-1)).toEqual(["multiline", "First line\nSecond line"]);
});

test("typed includes share generator state and require matching type declarations", () => {
  const dir = mkdtempSync(join(tmpdir(), "acsv-typed-includes-"));
  try {
    writeFileSync(
      join(dir, "users.acsv"),
      "id:int,name\n@set id=seq(),name=Player\n@rows 2",
    );
    const output = transpileNode({
      input: 'id:int,name\n@expect 3\ninclude "users.acsv"\n@row name=Admin',
      mode: "acsv",
      baseDir: dir,
    });
    expect(output).toBe("id,name\n1,Player\n2,Player\n3,Admin");
    writeFileSync(join(dir, "users.acsv"), "id,name\n1,Player");
    expect(() =>
      transpileNode({
        input: 'id:int,name\ninclude "users.acsv"',
        mode: "acsv",
        baseDir: dir,
      }),
    ).toThrow("same header and column types");
    writeFileSync(join(dir, "users.acsv"), "id:int,name\n@expect 2");
    expect(() =>
      transpileNode({
        input: 'id:int,name\ninclude "users.acsv"',
        mode: "acsv",
        baseDir: dir,
      }),
    ).toThrow("Put @expect in the main document");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
