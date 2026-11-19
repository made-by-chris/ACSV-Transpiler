import { expect, test } from "vitest";
import {
  compile,
  toRecords,
  serializeJSON,
  validate,
} from "../../dist/ZROWCompiler.js";
const run = (input) => compile({ input, mode: "zrow" });

test("typed headers validate data and export native JSON primitives", () => {
  const result = run(
    'id:int,name,active:bool,price:number,date:date\n@row id=1,name="001",active=false,price=12.5,date="2026-01-01"',
  );
  expect(result.csv).toBe(
    "id,name,active,price,date\n1,001,false,12.5,2026-01-01",
  );
  expect(toRecords(result)).toEqual([
    { id: 1, name: "001", active: false, price: 12.5, date: "2026-01-01" },
  ]);
  expect(JSON.parse(serializeJSON(result))).toEqual(toRecords(result));
});

test("literal CSV types and quoted typed-looking headers are not interpreted", () => {
  const literal = compile({ input: "id:int,active\n001,false", mode: "csv" });
  expect(toRecords(literal)).toEqual([{ "id:int": "001", active: "false" }]);
  expect(run('"id:int"\n1').headers).toEqual(["id:int"]);
});

test("JSON conversion rejects ambiguous headers without breaking CSV", () => {
  const duplicate = compile({ input: "id,id\n1,2" });
  expect(duplicate.csv).toBe("id,id\n1,2");
  expect(() => toRecords(duplicate)).toThrow("unique, non-empty");
  expect(() => toRecords(compile({ input: "id,\n1,2" }))).toThrow(
    "unique, non-empty",
  );
});

test("prototype-looking keys serialize as ordinary own properties", () => {
  const records = toRecords(
    run("__proto__,constructor\n@row __proto__=safe,constructor=value"),
  );
  expect(Object.hasOwn(records[0], "__proto__")).toBe(true);
  expect(JSON.stringify(records)).toBe(
    '[{"__proto__":"safe","constructor":"value"}]',
  );
});

test("unique constraints compare typed values rather than lexical formatting", () => {
  expect(() => run("id:int\n@unique id\n001\n1")).toThrow("Duplicate key");
});

test.each([
  ["id:int\n@row id=1.5", "E_TYPE"],
  ["active:bool\n@row active=0", "E_TYPE"],
  ['price:number\n@row price="NaN"', "E_TYPE"],
  ['date:date\n@row date="2026-02-30"', "E_TYPE"],
  ["id:int\n@row", "E_TYPE"],
  ["id:int\n9007199254740993", "E_TYPE"],
  ["id:integer\n1", "E_TYPE"],
  ["id:int,id\n1,2", "E_HEADER"],
])("types reject invalid data without coercing it: %s", (input, code) => {
  expect(validate({ input, mode: "zrow" })).toMatchObject({
    valid: false,
    diagnostics: [{ code }],
  });
});
