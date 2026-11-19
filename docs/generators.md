# Enums, randomness and time

These features require language version `# ZROW 0.3`, available in `zrow-js` 0.4.0. New documents should declare their version. Missing declarations use 0.3.

## Named text enums

```text
# ZROW 0.3
(enum Status "trial","active","paused")
(seed 42)
(cols id:int,status:Status)
(id=seq(),status=choice(Status))
(rows 10)
```

Declare enums before the column header. `(enum Name "first","second")` defines a named list of distinct text values. Use the name as a column type, as in `status:Status`, and inside `cycle(Status)` or `choice(Status)`. Ordinary columns and formulas remain available.

Every emitted value must belong to its column's enum, including literal CSV cells and named overrides. Values remain strings in JSON: an enum member `"001"` stays `"001"`. Enum names and values are case-sensitive. Enum names use ASCII identifiers of at most 64 characters and cannot shadow column names, primitive types or booleans. Declare each enum once in the main document; includes can use its types. An enum declaration emits no rows.

At most 32 enums with 32 members each are allowed. Members must be text constants of at most 4,000 characters. Bare text words are accepted; quote punctuation and empty text. Duplicate or omitted members fail. Explicit `""` is an allowed text member. Enum list members are literal text, including braces; they are not string templates. Use `cycle` to repeat the ordered list and `choice` for random selection. An enum name by itself is not a scalar value.

## Seeds

Use `(seed 42)` or `(seed "customers-v1")`. A seed is a safe integer or a nonempty string of at most 256 UTF-16 code units. Numeric `42` and text `"42"` are different seeds. Set it once in the main document before emitting rows. The library and conversion API also accept a `seed` option; supplying both an option and a declaration is an error.

Random functions require a seed when evaluated. They have no hidden global random state. For the same seed, column, expression structure and row index, the same random draws are produced. Referencing a random column twice in a row returns its cached value. Adding another column or changing evaluation order does not shift other columns' streams. Changing the structure of a column's expression can change its random stream.

As with `seq` and `cycle`, the row index starts at the rule's declaration. Literal overrides advance the persistent index. Reassigning a rule restarts it; temporary overrides start their own block index. Independent compilations of the same recipe repeat when the seed and any clock context are fixed.

These generators create synthetic data. They are unsuitable for passwords, tokens, secrets or cryptographic use.

## Random functions

| Function | Result |
| --- | --- |
| `rand()` / `randFloat()` | Uniform draw in `[0,1)`. |
| `rand(min,max)` / `randFloat(min,max)` | Uniform scaled draw from min toward max. Equal bounds produce that bound. |
| `randInt(min,max)` | Integer including both endpoints. Bounds must be safe integers spanning at most 2^32 values. |
| `normal()` | Normal sample with mean 0 and standard deviation 1. |
| `normal(mean,standardDeviation)` | Normal sample with nonnegative standard deviation. Zero deviation returns the mean. |
| `choice("A","B",...)` | Uniform selection from 1–32 values; evaluates the selected value lazily. An enum list can supply the values. |
| `choiceWeighted("A",9,"B",1)` | Selection from value/weight pairs. At most 16 pairs; weights must be nonnegative finite numbers with a positive finite sum. Zero-weight entries are never selected. Values are evaluated lazily; weights are evaluated to determine the selection. |

Bounds must be finite and ordered; the difference must be finite. Functions with optional ranges take either zero or two arguments. Binary64 arithmetic can round scaled floating draws to a boundary. `normal` uses a bounded Box–Muller calculation. Random selection creates a distribution; it does not guarantee exact category counts. Use `cycle` or explicit blocks when exact counts matter.

## Latitude and longitude

`latitude()` samples a latitude between −90 and 90 degrees. `longitude()` samples a longitude from −180 toward 180 degrees. `latitude(min,max)` and `longitude(min,max)` restrict the range. Equal bounds are valid. Latitude bounds must stay in [−90,90]; longitude bounds in [−180,180]. Longitude boxes cannot cross the antimeridian in one call; use explicit conditional branches for split boxes.

Latitude samples uniformly in sine of latitude; longitude samples uniformly in degrees. Together, independent draws sample surface area uniformly on a sphere, including within an ordinary latitude/longitude box. Results use a spherical model. They do not select addresses, roads, land or inhabited places. Both functions require a seed. Use `round(latitude(...),6)` to choose output precision.

## Date and time helpers

| Function | Result |
| --- | --- |
| `now()` | Captured reference instant as an ISO UTC timestamp, including milliseconds and `Z`. |
| `today()` | UTC calendar date of that instant, `YYYY-MM-DD`. |
| `yesterday()` | One UTC calendar day before `today()`. |
| `tomorrow()` | One UTC calendar day after `today()`. |

Each compilation captures one instant, shared by every row and helper. The host clock supplies it by default. To reproduce dates and timestamps, use `(time "2026-11-19T12:00:00Z")` in the main document before emitting rows. Alternatively provide `referenceTime` to the library/API. Supplying both is an error. Fixing a random seed alone does not fix the time.

Reference timestamps require seconds and an explicit `Z` or numeric UTC offset, with at most three fractional digits. Invalid dates and out-of-range years fail. Results use UTC even when the input uses another offset. `now()` returns text; use a text/untyped column for timestamps. `today`, `yesterday` and `tomorrow` fit `:date` columns. Existing date arithmetic and sequences work with these helpers: `seq(today(),1)` generates consecutive dates, and `today()+3d` adds three days.

```js
import { compile } from 'zrow-js';
const result = compile({
  input: '# ZROW 0.3\n(cols n:int,day:date)\n(n=randInt(1,100),day=today())\n(rows 3)',
  mode: 'zrow',
  seed: 42,
  referenceTime: '2026-11-19T12:00:00Z'
});
```

A fixed `time` declaration is also useful for CLI files, which can carry all their context in the source.

## Reproducing a random draw

The reference serializes `[seed,column,index,call,draw]` with ECMAScript JSON string encoding. `index` is the rule-relative zero-based row index. `call` is a zero-based function-call ID assigned in preorder during expression parsing, including nonrandom calls. `draw` is a zero-based counter local to that random function invocation.

Start with unsigned hash 2166136261. For each UTF-16 code unit of the serialized key, XOR the code unit and multiply by 16777619 modulo 2^32. Then apply:

```text
h = (h xor (h >>> 16)) * 0x85ebca6b mod 2^32
h = (h xor (h >>> 13)) * 0xc2b2ae35 mod 2^32
h = h xor (h >>> 16)
u = unsigned(h) / 2^32
```

`randInt` uses rejection sampling of the 32-bit draw to avoid modulo bias, bounded to 128 attempts. Normal and latitude generation use transcendental floating-point operations; independent runtimes may differ in final floating-point digits. See the [portable profile](portable-profile.md) and executable generator tests for compatibility details.
