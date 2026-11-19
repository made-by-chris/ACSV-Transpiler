import { expect, test } from "vitest";
import { compile, validate } from "../../dist/ZROWCompiler.js";
const run = (input) => compile({ input, mode: "zrow" });

test("named rows remove placeholders and never leak overrides", () => {
  const result = run(
    'id,email,role\n@set id=seq(),email="user{id}@example.test",role=member\n@rows 2\n@row email="admin@example.test",role=admin\n@rows 2 with role=guest\n@row\n@row email=""',
  );
  expect(result.rows).toEqual([
    ["1", "user1@example.test", "member"],
    ["2", "user2@example.test", "member"],
    ["3", "admin@example.test", "admin"],
    ["4", "user4@example.test", "guest"],
    ["5", "user5@example.test", "guest"],
    ["6", "user6@example.test", "member"],
    ["7", "", "member"],
  ]);
  expect(result.origins[2][2]).toEqual({ line: 4, kind: "override" });
});

test("named formulas see other named overrides independent of column order", () => {
  expect(
    run(
      "total,qty,price\n@set qty=2,price=10,total=qty*price\n@row total=qty*price,price=15,qty=3\n@row",
    ).rows,
  ).toEqual([
    ["45", "3", "15"],
    ["20", "2", "10"],
  ]);
});

test("generators are indexed from declaration, restart on reassignment, and advance through overrides", () => {
  expect(
    run(
      'id,kind\n@set id=seq(10,2),kind=cycle("A","B")\n@row\n@row id=99,kind=X\n@row\n@set id=seq(100),kind=cycle("C","D")\n@rows 2',
    ).rows,
  ).toEqual([
    ["10", "A"],
    ["99", "X"],
    ["14", "A"],
    ["100", "C"],
    ["101", "D"],
  ]);
});

test("block-local generators restart while persistent generators keep advancing", () => {
  expect(
    run(
      'id,label\n@set id=seq(),label=base\n@rows 2 with label="item{id}".upper()\n@rows 2 with label=seq(20)\n@row',
    ).rows,
  ).toEqual([
    ["1", "ITEM1"],
    ["2", "ITEM2"],
    ["3", "20"],
    ["4", "21"],
    ["5", "base"],
  ]);
});

test("date sequences are deterministic across leap days and descending steps", () => {
  expect(run('date\n@set date=seq("2024-03-01",-1)\n@rows 3').rows).toEqual([
    ["2024-03-01"],
    ["2024-02-29"],
    ["2024-02-28"],
  ]);
});

test("game curves and rounding stay finite and clamp to meaningful bounds", () => {
  expect(
    run(
      "level,hp,chance,price\n@set level=seq(),hp=round(100*pow(1.2,level-1)),chance=clamp(level*0.4,0,1),price=round(12.345,2)\n@rows 3",
    ).rows,
  ).toEqual([
    ["1", "100", "0.4", "12.35"],
    ["2", "120", "0.8", "12.35"],
    ["3", "144", "1", "12.35"],
  ]);
});

test("declared counts and uniqueness validate the whole output", () => {
  expect(
    run("id,name\n@expect 3\n@unique id\n@set id=seq(),name=Player\n@rows 3")
      .rows,
  ).toHaveLength(3);
  expect(() => run("id\n@expect 3\n@set id=seq()\n@rows 2")).toThrow(
    "Expected 3 rows, generated 2",
  );
  expect(() => run("id\n@unique id\n@rows 2 with id=1")).toThrow(
    "Duplicate key",
  );
  expect(
    run(
      "id,variant\n@unique id,variant\n@row id=1,variant=A\n@row id=1,variant=B",
    ).rows,
  ).toHaveLength(2);
});

test("legacy rows and controls can be mixed with the new notation", () => {
  expect(
    run("id,name\n> id++,name=Alice\n@row name=Bob\n,Carol\n@rows 2").rows,
  ).toEqual([
    ["1", "Bob"],
    ["2", "Carol"],
    ["3", "Alice"],
    ["4", "Alice"],
  ]);
});

test("directives in quoted data and literal CSV stay literal", () => {
  const input = "value\n@rows 500\n@row value=oops";
  expect(compile({ input, mode: "csv" }).csv).toBe(input);
  expect(run('value\n"@row value=oops"\n"first\n@rows 500"').rows).toEqual([
    ["@row value=oops"],
    ["first\n@rows 500"],
  ]);
});

test.each([
  ["a\n@rows 10001", "E_LIMIT"],
  ["a\n@rows -1", "E_DIRECTIVE"],
  ["a\n@row missing=1", "E_COLUMN"],
  ["a\n@row a=1,a=2", "E_DIRECTIVE"],
  ["a\n@set a=1,a=2", "E_DIRECTIVE"],
  ["a\n@rows 2 with", "E_DIRECTIVE"],
  ["a\n@row a=a+1", "E_CYCLE"],
  ["a\n@wat 5", "E_DIRECTIVE"],
  ["a\n@set a=cycle()", "E_EXPRESSION"],
  ["a\n@set a=seq(1,2,3)", "E_EXPRESSION"],
  ["a\n@row a=clamp(2,3,1)", "E_EXPRESSION"],
  ["a\n@row a=pow(10,1000)", "E_EXPRESSION"],
  ["a\n@row a=round(1,100)", "E_LIMIT"],
  ["a\n@unique missing", "E_COLUMN"],
  ["a\n@expect 1\n@expect 2", "E_ASSERT"],
])("invalid recipe gives a source diagnostic: %s", (input, code) => {
  expect(validate({ input, mode: "zrow" })).toMatchObject({
    valid: false,
    diagnostics: [{ code }],
  });
});

test("zero-row blocks do not advance generators and date steps validate on the first row", () => {
  expect(run("id\n@set id=seq(5)\n@rows 0\n@row").rows).toEqual([["5"]]);
  expect(() => run('date\n@set date=seq("2026-01-01",0.5)\n@row')).toThrow(
    "whole days",
  );
});

test("sequence boundaries allow the final valid value and reject the next one", () => {
  expect(run("id\n@set id=seq(9007199254740991)\n@row").rows).toEqual([
    ["9007199254740991"],
  ]);
  expect(() => run("id\n@set id=seq(9007199254740991)\n@rows 2")).toThrow(
    "safe numeric range",
  );
  expect(run('date\n@set date=seq("9999-12-31")\n@row').rows).toEqual([
    ["9999-12-31"],
  ]);
  expect(() => run('date\n@set date=seq("9999-12-31")\n@rows 2')).toThrow(
    "Date is out of range",
  );
});
