import { expect, test } from "vitest";
import { compile, validate } from "../../dist/ACSVTranspiler.js";
const run = (input) => compile({ input, mode: "acsv" });

test("formulas recalculate per row using literal overrides and forward references", () => {
  expect(
    run("total,price,qty\n> total=price*qty,price=10,qty=2\n,,\n,15,3").rows,
  ).toEqual([
    ["20", "10", "2"],
    ["45", "15", "3"],
  ]);
});

test("constant dates stay constant until an explicit date increment", () => {
  expect(run("id,date\n> id++,date=2024-02-28 x2\n> date++ x3").rows).toEqual([
    ["1", "2024-02-28"],
    ["2", "2024-02-28"],
    ["3", "2024-02-28"],
    ["4", "2024-02-29"],
    ["5", "2024-03-01"],
  ]);
});

test("explicit counter starts, overrides and STOP have predictable effects", () => {
  expect(
    run("id,name\n> id=10,id++\n,Alice\n99,Bob\n> id++STOP\n,Charlie").rows,
  ).toEqual([
    ["10", "Alice"],
    ["99", "Bob"],
    ["99", "Charlie"],
  ]);
});

test("conditions are lazy and templates preserve punctuation", () => {
  expect(
    run('n,result,label\n> result=if(n>0,10/n,0),label="Item {n}"\n0,,\n2,,')
      .rows,
  ).toEqual([
    ["0", "0", "Item 0"],
    ["2", "5", "Item 2"],
  ]);
});

test.each([
  ["a,b\n> a=b,b=a x1", "E_CYCLE"],
  ["a\n> missing++", "E_COLUMN"],
  ["a\n> a=randInt(1,10)", "E_UNSUPPORTED"],
  ["a\n> a=globalThis.process.exit()", "E_COLUMN"],
  ["a\n> a=(()=>42)()", "E_EXPRESSION"],
  ["a\n> a=1/0 x1", "E_EXPRESSION"],
  ["a\n> a++ x10001", "E_LIMIT"],
  ["a,b\n> a=1..3,b=1..2", "E_RANGE"],
])("invalid recipe fails explicitly: %s", (input, code) => {
  expect(validate({ input, mode: "acsv" })).toMatchObject({
    valid: false,
    diagnostics: [{ code }],
  });
});

test("provenance identifies rules and explicit overrides", () => {
  const result = run("id,name\n> id++,name=Alice\n,Bob");
  expect(result.origins[0]).toEqual([
    { line: 2, kind: "sequence" },
    { line: 3, kind: "literal" },
  ]);
});

test("streaming and stats reflect exactly the generated data rows", () => {
  const output = [],
    stats = [];
  const result = compile({
    input: "id,name\n> id++,name=Alice x3",
    mode: "acsv",
    streaming: true,
    streaming_callback: (r) => output.push(r),
    stats: true,
    stats_callback: (s) => stats.push(s),
  });
  expect(output).toEqual(["1,Alice", "2,Alice", "3,Alice"]);
  expect(stats).toEqual([
    expect.objectContaining({ output_rows: 3, columns: 2 }),
  ]);
  expect(result.rows).toHaveLength(3);
});

test("initializing a counter does not prematurely evaluate unrelated formulas", () => {
  expect(
    run("id,total,price,qty\n> total=price*qty\n> id=10,id++,price=5,qty=3 x1")
      .rows,
  ).toEqual([["10", "15", "5", "3"]]);
});

test("derived text and numeric literals are bounded before runaway expansion", () => {
  const names = Array.from({ length: 25 }, (_, i) => `c${i}`);
  const controls = names.map(
    (name, i) => `${name}=${i ? `c${i - 1}+c${i - 1}` : '"x"'}`,
  );
  expect(
    validate({
      input: `${names.join(",")}\n> ${controls.join(",")} x1`,
      mode: "acsv",
    }),
  ).toMatchObject({ valid: false, diagnostics: [{ code: "E_LIMIT" }] });
  expect(validate({ input: "n\n> n=1e309 x1", mode: "acsv" })).toMatchObject({
    valid: false,
    diagnostics: [{ code: "E_EXPRESSION" }],
  });
});

test("range controls accept normal spacing and produce the inclusive endpoints", () => {
  expect(run("level,hp\n> hp=100+level*10\n> level = 1 .. 3").rows).toEqual([
    ["1", "110"],
    ["2", "120"],
    ["3", "130"],
  ]);
});

test("counters reject overflow only when the overflowing row is requested", () => {
  expect(run("n\n> n=9007199254740991,n++ x1").rows).toEqual([
    ["9007199254740991"],
  ]);
  expect(() => run("n\n> n=9007199254740991,n++ x2")).toThrow(
    "safe numeric range",
  );
  expect(run("date\n> date=9999-12-31,date++ x1").rows).toEqual([
    ["9999-12-31"],
  ]);
  expect(() => run("date\n> date=9999-12-31,date++ x2")).toThrow(
    "Date is out of range",
  );
});
