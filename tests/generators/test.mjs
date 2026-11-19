import { test, expect } from "vitest";
import { compile, toRecords, validate } from "../../dist/ZROWCompiler.js";
const run = (body, config = {}) =>
  compile({ input: "# ZROW 0.3\n" + body, mode: "zrow", ...config });
test("named enums validate generated, literal and overridden values and preserve text", () => {
  const input =
    '(enum Role "member","admin","guest")\n(cols id:int,role:Role)\n(id=seq(),role=cycle(Role))\n(rows 3)\n4,admin\n(row role=guest)';
  expect(toRecords(run(input)).map((r) => r.role)).toEqual([
    "member",
    "admin",
    "guest",
    "admin",
    "guest",
  ]);
  expect(() => run(input + "\n6,owner")).toThrow("Role");
  expect(() =>
    run(
      '(enum Code "001","002")\n(cols code:Code)\n(code=cycle(Code))\n(rows 1)',
    ),
  ).not.toThrow();
  expect(
    toRecords(
      run(
        '(enum Code "001","002")\n(cols code:Code)\n(code=cycle(Code))\n(rows 1)',
      ),
    )[0].code,
  ).toBe("001");
});
test("enums reject duplicate declarations, values, invalid names and excessive lists", () => {
  for (const input of [
    '(enum R "a","a")\n(cols r:R)',
    '(enum R "a")\n(enum R "b")\n(cols r:R)',
    '(enum int "a")\n(cols r:int)',
    '(cols r)\n(enum R "a")',
  ])
    expect(() => run(input)).toThrow();
});
test("random output repeats by seed, changes by seed and is independent of other columns", () => {
  const a = run(
    "(seed 42)\n(cols id:int,n:int,x:number)\n(id=seq(),n=randInt(1,100),x=rand())\n(rows 40)",
  );
  expect(
    run(
      "(seed 42)\n(cols id:int,n:int,x:number)\n(id=seq(),n=randInt(1,100),x=rand())\n(rows 40)",
    ).csv,
  ).toBe(a.csv);
  expect(
    run(
      "(seed 43)\n(cols id:int,n:int,x:number)\n(id=seq(),n=randInt(1,100),x=rand())\n(rows 40)",
    ).csv,
  ).not.toBe(a.csv);
  expect(
    run(
      "(seed 42)\n(cols extra:number,n:int,x:number)\n(extra=rand(),n=randInt(1,100),x=rand())\n(rows 40)",
    ).rows.map((r) => r.slice(1)),
  ).toEqual(a.rows.map((r) => r.slice(1)));
  for (const [, n, x] of a.rows) {
    expect(+n).toBeGreaterThanOrEqual(1);
    expect(+n).toBeLessThanOrEqual(100);
    expect(+x).toBeGreaterThanOrEqual(0);
    expect(+x).toBeLessThan(1);
  }
});
test("random selection supports enum lists and weighted pairs", () => {
  const r = run(
    '(enum R "a","b")\n(seed "sample")\n(cols choice:R,weighted:R,n:number)\n(choice=choice(R),weighted=choiceWeighted("a",0,"b",1),n=normal(10,0))\n(rows 30)',
  );
  expect(
    r.rows.every(
      (r) => ["a", "b"].includes(r[0]) && r[1] === "b" && r[2] === "10",
    ),
  ).toBe(true);
});
test("geographic generators obey bounds and return finite values", () => {
  const r = run(
    "(seed 9)\n(cols lat:number,lon:number)\n(lat=latitude(52,53),lon=longitude(13,14))\n(rows 100)",
  );
  for (const [lat, lon] of r.rows) {
    expect(+lat).toBeGreaterThanOrEqual(52);
    expect(+lat).toBeLessThanOrEqual(53);
    expect(+lon).toBeGreaterThanOrEqual(13);
    expect(+lon).toBeLessThanOrEqual(14);
  }
});
test("clock functions share one fixed UTC instant and accept leap-day date arithmetic", () => {
  expect(
    run(
      '(time "2024-03-01T00:15:00+02:00")\n(cols today:date,yesterday:date,tomorrow:date,now)\n(today=today(),yesterday=yesterday(),tomorrow=tomorrow(),now=now())\n(rows 2)',
    ).rows,
  ).toEqual(
    Array(2).fill([
      "2024-02-29",
      "2024-02-28",
      "2024-03-01",
      "2024-02-29T22:15:00.000Z",
    ]),
  );
  expect(
    run("(cols day:date)\n(day=seq(today(),1))\n(rows 2)", {
      referenceTime: "2024-02-28T12:00:00Z",
    }).rows,
  ).toEqual([["2024-02-28"], ["2024-02-29"]]);
});
test("missing seeds, invalid ranges, weights, times and conflicting context fail explicitly", () => {
  for (const expr of [
    "rand()",
    "randInt(2,1)",
    "randInt(0,1.5)",
    "randInt(0,4294967296)",
    "rand(2,1)",
    "normal(0,-1)",
    'choiceWeighted("a",-1)',
    'choiceWeighted("a",0)',
    "latitude(-91,0)",
    "longitude(0,181)",
  ])
    expect(() =>
      run(
        "(cols n)\n(n=" + expr + ")\n(rows 1)",
        expr === "rand()" ? {} : { seed: 1 },
      ),
    ).toThrow();
  for (const time of [
    "not a date",
    "2024-02-30T12:00:00Z",
    "2024-01-01T12:00:00",
  ])
    expect(() =>
      run("(cols n)\n(n=now())\n(rows 1)", { referenceTime: time }),
    ).toThrow();
  expect(() => run("(seed 1)\n(cols n)", { seed: 2 })).toThrow();
  expect(() => run("(cols n)\n(row)\n(seed 1)")).toThrow();
});
test("old language versions reject new functions and preserve new-looking literal cells", () => {
  for (const version of ["0.1", "0.2"]) {
    expect(
      validate({
        input: "# ZROW " + version + "\nn\n@set n=rand()\n@row",
        mode: "zrow",
      }).valid,
    ).toBe(false);
    expect(
      compile({ input: "# ZROW " + version + "\nn\n(seed 1)", mode: "zrow" })
        .rows,
    ).toEqual([["(seed 1)"]]);
  }
});
test("enum members are verbatim, empty members explicit, negative seeds valid", () => {
  expect(
    run(
      '(enum Label "{id}","")\n(seed -1)\n(cols id:int,label:Label)\n(id=seq(),label=cycle(Label))\n(rows 2)',
    ).rows,
  ).toEqual([
    ["1", "{id}"],
    ["2", ""],
  ]);
  expect(() => run('(enum R "a",)\n(cols r:R)')).toThrow();
  const numeric = run("(cols n:number)\n(n=rand())\n(rows 3)", { seed: 42 });
  expect(
    run("(cols n:number)\n(n=rand())\n(rows 3)", { seed: "42" }).csv,
  ).not.toBe(numeric.csv);
});
test("seeded normal and geographic samples have the intended distributions", () => {
  const rows = run(
    '(seed "distribution-check")\n(cols n:number,lat:number,lon:number)\n(n=normal(),lat=latitude(),lon=longitude())\n(rows 5000)',
  ).rows;
  const mean = rows.reduce((s, r) => s + +r[0], 0) / rows.length;
  const variance =
    rows.reduce((s, r) => s + (+r[0] - mean) ** 2, 0) / rows.length;
  const sineSquared =
    rows.reduce((s, r) => s + Math.sin((+r[1] * Math.PI) / 180) ** 2, 0) /
    rows.length;
  expect(Math.abs(mean)).toBeLessThan(0.08);
  expect(variance).toBeGreaterThan(0.9);
  expect(variance).toBeLessThan(1.1);
  expect(Math.abs(sineSquared - 1 / 3)).toBeLessThan(0.03);
});
test("fixed hash vectors and lazy dependencies retain exact seeded draws", () => {
  const a = run("(cols n:number)\n(n=rand())\n(rows 2)", { seed: 42 });
  expect(a.rows).toEqual([["0.11388820596039295"], ["0.1311836838722229"]]);
  expect(
    run("(cols n:number)\n(n=rand())\n(rows 1)", { seed: "42" }).rows,
  ).toEqual([["0.3668995685875416"]]);
  const b = run("(cols copy:number,n:number)\n(copy=n+n,n=rand())\n(rows 2)", {
    seed: 42,
  });
  expect(b.rows.map((r) => r[1])).toEqual(a.rows.map((r) => r[0]));
  expect(b.rows.map((r) => +r[0])).toEqual(a.rows.map((r) => +r[0] * 2));
});
test("literal overrides advance seeded rule indices and reassignments restart them", () => {
  const a = run("(seed 42)\n(cols n:number)\n(n=rand())\n(rows 3)").rows;
  expect(
    run(
      "(seed 42)\n(cols n:number)\n(n=rand())\n(row)\n(row n=99)\n(row)\n(n=rand())\n(row)",
    ).rows,
  ).toEqual([a[0], ["99"], a[2], a[0]]);
});
