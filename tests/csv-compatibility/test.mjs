import { expect, test } from "vitest";
import transpile, {
  compile,
  parseCSV,
  serializeCSV,
} from "../../dist/ACSVTranspiler.js";

const examples = [
  "value\n1+2\na=b\n#urgent\n> urgent\ninclude data.csv",
  'id,note\n1,"hello, world"\n2,"She said ""hi"""',
  'id,note\r\n1,"first\r\nsecond"\r\n',
  "\ufeffid,name\r\n001,  Alice  \r\n002,Bob\r\n",
  "a,b\nfoo(bar,baz",
  'value\n""\n',
  "a,b\n,",
  "",
];
for (const input of examples) {
  test(`literal CSV preserves bytes: ${JSON.stringify(input)}`, () => {
    expect(transpile({ input, mode: "csv" })).toBe(input);
    expect(transpile({ input })).toBe(input);
  });
}

test("record parser handles escaped quotes, embedded line breaks and spaces", () => {
  expect(parseCSV('a,b\n"a""b","first\nsecond"\n x , y ')).toEqual([
    ["a", "b"],
    ['a"b', "first\nsecond"],
    [" x ", " y "],
  ]);
});

test("serializer round-trips adversarial literal values", () => {
  const cells = [
    "",
    "1+2",
    "a=b",
    "#urgent",
    "> row",
    "comma,value",
    'quote"value',
    "multi\nline",
    "\r\n",
    "  spaces  ",
    "雪",
    "(a,b)",
    "__proto__",
  ];
  const rows = cells.map((v, i) => [String(i), v]);
  expect(parseCSV(serializeCSV(rows))).toEqual(rows);
  expect(parseCSV(serializeCSV([[""]]))).toEqual([[""]]);
});

test.each([
  ["a,b\n1", "E_WIDTH", 2],
  ["a,b\n1,2,3", "E_WIDTH", 2],
  ['a\n"unfinished', "E_CSV_QUOTE", 2],
  ['a\n"closed"oops', "E_CSV_QUOTE", 2],
])("invalid CSV reports a location: %s", (input, code, line) => {
  try {
    compile({ input, mode: "csv" });
    throw new Error("Should reject");
  } catch (error) {
    expect(error.code).toBe(code);
    expect(error.line).toBe(line);
  }
});

test("ACSV data cells stay literal, quoted empties override defaults", () => {
  const result = compile({
    mode: "acsv",
    input:
      'note,status\n> status=active\n1+2,\na=b,""\n"#urgent",\n"> urgent",',
  });
  expect(result.rows).toEqual([
    ["1+2", "active"],
    ["a=b", ""],
    ["#urgent", "active"],
    ["> urgent", "active"],
  ]);
});
