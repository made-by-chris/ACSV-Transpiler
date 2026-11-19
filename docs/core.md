# XCSV language contract

XCSV describes a flat table through ordinary CSV values and deterministic recipes. It runs locally in the browser or in Node. The same recipe can produce CSV strings or JSON objects with explicitly declared primitive types.

## A readable recipe

```acsv
id:int,email,role,active:bool
@expect 6
@unique id
@set id=seq(),email="user{id}@example.test"
@set role=member,active=true
@rows 3
@row email="admin@example.test",role=admin
@rows 2 with role=guest,active=false
```

```csv
id,email,role,active
1,user1@example.test,member,true
2,user2@example.test,member,true
3,user3@example.test,member,true
4,admin@example.test,admin,true
5,user5@example.test,guest,false
6,user6@example.test,guest,false
```

No placeholder commas are required. Naming an override makes its meaning independent of column position.

## Two input modes

- **`csv` (library default):** every cell is literal. A valid document is returned unchanged, including quotes, whitespace, BOM, CRLF/LF/CR endings and final newline. Header text such as `id:int` is also literal.
- **`acsv`:** the first non-comment, non-blank record declares columns. Records beginning with `@` are directives, `>` introduces supported legacy controls, `#` introduces comments, and `include "file.acsv"` is an explicit Node-only include.

Both modes support comma-separated fields, doubled quotes and quoted multiline fields. Quotes surround the whole CSV field. Spaces inside CSV fields are significant. Data records must match the header width exactly; malformed quotes or ragged rows fail. Empty input is valid; a final newline does not create a row.

Quote the first field when literal XCSV data begins with a reserved prefix. Prefixes inside quoted multiline data are never directives. Directives begin at column 1 and occupy one physical line. Use multiple `@set` lines to organize a recipe.

XCSV output uses LF record endings and no final newline; typed annotations are removed from output headers. Literal CSV mode returns the original input instead of reserializing it. Browser text areas may normalize pasted line endings; use the CLI or library when byte preservation matters.

## Directives

| Directive | Meaning |
| --- | --- |
| `@set role=member,active=true` | Set persistent defaults or formulas. Emit no rows. Later assignments replace earlier rules. |
| `@row` | Emit one row using the current defaults. |
| `@row role=admin,email=""` | Emit one row with named overrides. Omitted columns use defaults. An explicit empty string remains empty. |
| `@rows 20` | Emit exactly 20 rows. Zero is allowed and advances no generators. |
| `@rows 3 with role=guest` | Emit three rows with temporary overrides; persistent defaults resume afterward. |
| `@expect 24` | Assert the total output row count. Declare once, after the header and near the start, to help detect truncated generated recipes. |
| `@unique id` | Assert uniqueness of a single key over the whole output. |
| `@unique item,variant` | Assert uniqueness of the **combined** key. Use separate directives to require each column to be unique individually. |

Assignments are separated by commas outside quotes and parentheses. A directive cannot assign the same column twice. Unknown columns fail. Bare words such as `member` can be literal defaults, but quote punctuation and text matching a column name. Formula references use ASCII identifiers (`[A-Za-z_][A-Za-z0-9_]*`); use simple names such as `unit_price`.

Overrides are evaluated together and can reference each other in any order. Persistent formulas see the row's overridden values. A self-reference such as `@row hp=hp*2` is circular; write the intended formula from its inputs, or use `prev(hp)` explicitly. Circular dependencies fail.

Count and unique checks run after the full document is compiled and before callbacks or CLI writes. They include rows emitted before the check's declaration. Unique checks compare typed values, so integer keys `001` and `1` collide. Put `@expect` in the main document rather than an included fragment. At most 32 unique-key checks are allowed.

## Deterministic generators

- `seq()` produces 1, 2, 3, …
- `seq(100, 5)` produces 100, 105, 110, …
- `seq("2026-01-01", 2)` advances two UTC calendar days per row. Date steps must be whole days.
- `cycle("slime", "golem", "bat")` repeats the listed values. It accepts 1–32 expressions and evaluates the selected expression lazily.

Each expression is indexed from the row where its rule was assigned. Its first emitted row has index zero. Every emitted row advances this index, even if that column has a literal or named override. Reassigning the rule restarts its index. Generators in a `with` override start at that block's first row; persistent generators keep advancing through the block.

```acsv
id,kind
@set id=seq(10,2),kind=cycle("A","B")
@row
@row id=99,kind=X
@row
```

```csv
id,kind
10,A
99,X
14,A
```

Generators use no randomness, clock, external catalog or hidden global state. For arbitrary real-world records, write literal rows instead of inventing a pattern.

## Types and JSON

Unquoted header annotations opt into validation: `id:int`, `price:number`, `active:bool`, `date:date`, `name:text`. Unannotated columns are text. Quote an entire typed-looking header (`"id:int"`) if that colon is part of its literal name. Unknown type annotations fail.

| Type | Accepted values | JSON value |
| --- | --- | --- |
| `text` / untyped | Any string, including empty and `001` | string |
| `int` | Decimal digits with optional sign; safe integer range | number |
| `number` | JSON-style decimal/scientific notation, finite; integer values must also be safe | number |
| `bool` | Exactly `true` or `false` | boolean |
| `date` | Valid four-digit-year `YYYY-MM-DD` | string |

There is no implicit null conversion or inferred typing. An empty text cell stays `""` in JSON; an empty numeric, boolean or date cell is an error. CSV always contains strings and preserves literal numeric spellings such as `001`; the declared `int` type intentionally converts that value to JSON number 1. Decimal calculations use binary64 numbers, not exact financial arithmetic.

`compile(config)` returns `{ csv, headers, columns, rows, origins, stats }`. `columns` contains `{ name, type, explicit }`. `rows` is always a string matrix. `toRecords(result)` returns JSON-compatible objects; `serializeJSON(result, pretty = true)` returns JSON text. Both require unique, nonempty header names. Literal CSV with duplicate headers still compiles and exports as CSV; only object conversion fails. Keys such as `__proto__` are ordinary own properties.

## Expressions

Expressions execute only in named assignments or legacy controls. Ordinary CSV data cells are literal. There is no JavaScript evaluation or object access.

- Arithmetic `+ - * / %`, unary `+ -`, parentheses; comparisons `== != < > <= >=`; boolean negation `!`.
- Numeric strings participate in arithmetic. `+` concatenates when either operand is nonnumeric. Zero, empty string and `false` are false in conditions.
- `if(condition, yes, no)` evaluates only the chosen branch.
- `prev(column)` reads the previous emitted row, or 0 before the first row.
- `pad(id, 4)` zero-pads a string; width is 0–100.
- `"{first}.{last}@example.test".lower()` / `.upper()` interpolate current-row values and change case.
- `round(value, digits = 0)` accepts 0–8 decimal places. It uses binary64 multiplication and rounding with half ties toward positive infinity; it is not decimal banking rounding.
- `min(...)` and `max(...)` accept 1–32 numeric arguments.
- `clamp(value, minimum, maximum)` bounds a value; minimum must not exceed maximum.
- `pow(base, exponent)` supports nonlinear curves; non-finite results fail.
- ISO date literals remain constant unless explicitly sequenced/incremented. Date arithmetic accepts `date + 3d` or `date - 1d`. `formatDate(date, "YYYY-MM-DD")` supports this one format.

Expression strings use single or double quotes, doubled matching quotes, and escapes `\n`, `\r`, `\t`, `\\`, `\"`, `\'`. CSV data uses standard CSV quoting instead.

## Ordinary rows and legacy notation

Existing `>` recipes continue working. Data records emit one row; nonempty literal values override defaults for that row. Unquoted empty fields use defaults; quoted empty fields (`""`) override them with an empty string. A blank physical line is cosmetic in XCSV mode.

| Legacy control | Meaning |
| --- | --- |
| `> role=member` | Set a persistent value/formula without emitting a row. |
| `> id++` / `> id--` | Uninitialized counter starts at 1 / -1 and advances each emitted row. |
| `> id=10,id++` | Start a counter at 10. |
| `> id++2` / `> id--2` | Counter with an integer step. Changing a running counter's step starts at the previous emitted value plus the new step. |
| `> id+` / `> id-` | Change a value once. |
| `> id++STOP` / `> id--STOP` | Freeze at the last emitted value, including an override. |
| `> id++,role=member x6` | Apply controls and emit six rows. |
| `> level = 1 .. 5` | Emit an inclusive ascending integer range; one range per control, without `xN`. |

For new recipes prefer `seq`, `@rows` and named `@row` overrides. CSV rows and old controls can be freely mixed with them.

## Includes, diagnostics and limits

The portable module never opens files. Use the CLI or `acsv/node` with `baseDir` to enable includes. Included headers and type declarations must match. Relative paths resolve from the including file and remain inside `baseDir`, including through symlinks; cycles fail. Rules and rows are applied inline. Origins currently expose line numbers, not included filenames.

`validate(config)` returns `{ valid, diagnostics }`; `isValid(config)` returns a boolean. The first diagnostic has `code`, `message`, one-based source `line` and `column`. CSV errors have field positions; directive errors usually identify the directive line. Type and uniqueness errors also identify the output row. Validation invokes no callbacks.

Limits: 1,000,000 input UTF-16 code units including includes; 10,000 output data rows; 128 columns; 250,000 cells; 10,000,000 expanded value code units; 100,000 code units per generated expression value; 4,000 code units / 256 tokens / 40 nesting levels per expression; 10 include levels; 32 unique checks. Integer sequences must remain within the safe integer range. Bounds are enforced before callbacks and output writes.

The compatibility `streaming_callback` delivers serialized data rows after the entire document succeeds, excluding the header. It buffers output; it is not constant-memory streaming. `stats_callback` fires once. `input_rows` counts physical main-source lines; `output_rows` counts data records. Each origin identifies `literal`, `default`, `sequence` (legacy counter), `generator`, `expression` or `override` and a source line.

The CLI infers input mode from `.acsv` and output format from `.json`; `--mode csv|acsv` and `--format csv|json` override these. Writes are atomic after successful compilation/conversion. Errors exit 1 and preserve an existing output file.

## Compatibility and deferred work

Literal CSV remains the default API mode. Recipe callers must pass `mode: 'acsv'`. The new `@` prefix and unquoted `:type` header suffixes are reserved in XCSV mode; quote literal fields that use them. Existing valid `>` recipes retain their behavior.

Random/Faker generators, implicit/nested scopes, null generators, custom dialects and spreadsheet-safety directives remain deferred. The old proposal vectors are preserved in `docs/roadmap-fixtures/`; active tests reject their unsupported syntax. Temporary named overrides are now supported through `@row` and `@rows ... with` with the explicit semantics above.

CSV quoting is not a spreadsheet formula-safety policy. Literal values are intentionally preserved. See [portable profile](portable-profile.md) for implementation boundaries and conformance vectors.

## Version marker

Put `# XCSV 0.1` on the first line of new recipes, before the column header. This optional declaration is excluded from CSV and JSON output. Missing declarations use the current language. Unsupported, malformed, repeated or misplaced declarations fail with E_VERSION. The language version is separate from the implementation package version. Use mode xcsv; acsv is a compatibility alias. Agent entry point: https://acsv.majaku.com/llms.txt .
