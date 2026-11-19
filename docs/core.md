# ZROW language reference

ZROW describes a flat table using column declarations, literal CSV records and generation rules. It compiles to CSV or typed JSON. New recipes use `# ZROW 0.3`.

## A document

```zrow
# ZROW 0.3
(cols id:int,name,role)
(expect 3)
(unique id)
(id=seq(),name="User {id}",role=member)
(rows 2)
3,"Shelley, Chris",admin
```

```csv
id,name,role
1,User 1,member
2,User 2,member
3,"Shelley, Chris",admin
```

The version declaration is optional; an omitted declaration uses the current language, 0.3. Declare it before the header. Unsupported, malformed, repeated or misplaced declarations fail with E_VERSION. The language version is independent of the npm package version. Earlier ZROW versions remain readable for existing files.

Forms begin in column 1 and occupy one physical line. Parenthesized forms use comma-separated expressions. Blank lines and full-line comments beginning with `#` do not emit rows. A trailing `#` comment can follow a complete form, for example `(rows 6) # generate six rows`. Comments on other instruction lines need a space before `#`. Hashes inside quoted strings and literal CSV fields remain data. A document contains one column header. Metadata declarations can precede it.

## Columns and types

`(cols id:int,name,active:bool)` declares columns in output order. Column names must be nonempty and unique. Optional primitive types are `text`, `int`, `number`, `bool` and `date`. Untyped columns are text. A named enum can also be used as a type. Quote a complete header field to keep a literal colon in its name. An ordinary CSV header is also accepted.

| Type | Accepted values | JSON value |
| --- | --- | --- |
| text / untyped | Any string, including empty and `001` | string |
| int | Signed decimal digits within the safe integer range | number |
| number | Finite JSON-style decimal/scientific notation; integer results must be safe integers | number |
| bool | Exactly `true` or `false` | boolean |
| date | Valid `YYYY-MM-DD`, years 0000–9999 | string |
| named enum | One of its declared text members | string |

There is no implicit null conversion or type inference. An empty text cell remains an empty string. Empty numeric, boolean and date values fail. CSV preserves literal spellings such as `001`; an explicit int column converts that value to JSON number 1. Decimal calculations use binary64 arithmetic.

## Defaults, rows and checks

| Form | Meaning |
| --- | --- |
| `(role=member,active=true)` | Set persistent defaults/formulas. Emits no rows. Later assignments replace earlier rules. |
| `(row)` | Emit one row using current defaults. |
| `(row role=admin,name="")` | Emit one row with named overrides. Omitted columns use defaults. |
| `(rows 20)` | Emit exactly 20 rows. Zero emits nothing and advances no generators. |
| `(rows 3 with role=guest)` | Emit three rows with temporary overrides; persistent defaults resume afterward. |
| `(expect 24)` | Check the total output row count. Declare once in the main document. |
| `(unique id)` | Check a single key over the entire output. |
| `(unique item,variant)` | Check the combined key. Separate checks require each column to be unique individually. |

No placeholder comma rows are needed. Assignments are separated by commas outside strings and parentheses. Unknown fields and repeated assignments within a form fail. Use ASCII identifiers for formula references. Bare words can be text defaults; quote punctuation and words matching a column or enum name.

Overrides are evaluated together and can refer to each other in any order. Persistent formulas see the row's overridden inputs. Self-references are circular; `prev(column)` reads the previous emitted row instead. Dependency cycles fail.

Count and unique checks include all output rows. Unique checks compare typed values: integer keys `001` and `1` collide. At most 32 unique checks are allowed. Checks complete before callbacks and file writes.

## Literal CSV rows

A CSV record emits one row. Nonempty fields override defaults for that row. Unquoted empty fields use defaults; quoted empty fields explicitly produce empty text. Every data record must match the header width. Commas separate fields; double quotes surround fields containing commas, quotes or line endings. Double an embedded quote. Spaces inside fields are significant.

```zrow
# ZROW 0.3
(cols id:int,name,role)
(id=seq(),name="User {id}",role=member)
(row)
2,"A comma, and a ""quote""",admin
(row)
```

```csv
id,name,role
1,User 1,member
2,"A comma, and a ""quote""",admin
3,User 3,member
```

Quote the first field if it would otherwise be recognized as a form, comment, control or include. A literal cell containing `(rows 3)` is written `"(rows 3)"`. Prefixes inside quoted multiline fields remain literal.

## Generators and expressions

`seq()` produces 1, 2, 3, …; `seq(100,5)` produces 100, 105, 110, …; `seq("2026-01-01",2)` advances two UTC calendar days per row. Date steps must be whole days. `cycle("A","B")` repeats its list in order. Enum lists can supply cycle values.

Each rule has a zero-based index starting at its declaration. Every emitted row advances the index, even when a value is overridden. Reassigning a rule restarts it. Generators in a temporary block start at that block; persistent generators continue advancing through it.

Expressions support arithmetic `+ - * / %`, unary `+ - !`, comparisons `== != < > <= >=`, current-row references and parentheses. Numeric strings participate in arithmetic; `+` concatenates if either operand is nonnumeric. Zero, empty text and false are false in conditions.

| Helper | Meaning |
| --- | --- |
| `if(condition,yes,no)` | Evaluate only the selected branch. |
| `prev(column)` | Previous emitted value, or 0 before the first row. |
| `pad(id,4)` | Pad text with zeroes; width 0–100. |
| `"user{id}@example.test"` | Interpolate current-row values into text. |
| `"{name}".lower()` / `.upper()` | Change text case. |
| `round(value,digits)` | Round to 0–8 decimal places; digits defaults to zero. |
| `min(...)` / `max(...)` | Minimum or maximum of 1–32 numeric arguments. |
| `clamp(value,min,max)` | Bound a value; min must not exceed max. |
| `pow(base,exponent)` | A finite power result. |
| `date+3d` / `date-1d` | UTC day arithmetic on an ISO date. |
| `formatDate(date,"YYYY-MM-DD")` | Validate/format a date; this is the supported format. |

Expression strings support single/double quotes, doubled matching quotes and escapes `\n`, `\r`, `\t`, `\\`, `\"`, `\'`. Literal CSV uses CSV quoting. ISO dates stay constant unless explicitly sequenced or advanced. Nonfinite arithmetic fails. Rounding uses binary64 multiplication and half ties toward positive infinity, rather than exact financial arithmetic.

## Enums, randomness and time

`(enum Status "trial","active","paused")` declares allowed text values before the header. Use `status:Status` as a column type and `cycle(Status)` or `choice(Status)` as a generator. Enum values are checked for every emitted row.

`(seed 42)` or `(seed "sample")` fixes the random context. Generators include `rand`, `randFloat`, inclusive `randInt`, `normal`, `choice`, `choiceWeighted`, `latitude` and `longitude`. Random generators require a seed when evaluated. These generators produce synthetic data.

`today()`, `tomorrow()` and `yesterday()` return UTC dates. `now()` returns an ISO UTC timestamp. All rows share one captured reference instant. `(time "2026-11-19T12:00:00Z")` fixes that instant; otherwise the host clock supplies it. Fix the time as well as the seed to reproduce output containing clock helpers.

See [enums and generators](generators.md) for complete ranges, limits, distribution rules, enum declarations and the reproducible hash specification.

## Library modes and output

`compile({input,mode:'zrow'})` compiles a recipe. Literal `csv` is the library default: it interprets every cell literally and preserves valid bytes, including quotes, whitespace, BOM, line endings and final newline. Header annotations and apparent forms are literal in CSV mode. Malformed quoting and ragged rows fail in either mode. Empty input is valid; a final newline creates no extra row.

Generated CSV uses LF endings without a final newline, and removes type annotations from headers. The browser may normalize pasted line endings; use the library or CLI when byte preservation matters.

`compile` returns `{csv,headers,columns,rows,origins,stats}`. Rows are string matrices. Column metadata includes name, primitive type, explicit annotation and enum metadata when applicable. `toRecords(result)` returns typed objects; `serializeJSON(result,pretty=true)` returns JSON text. JSON objects require unique, nonempty header names. Literal CSV can retain duplicate headers and still export CSV. Keys such as `__proto__` are ordinary own properties.

The config accepts `seed` and `referenceTime` as alternatives to document declarations. Do not supply both representations. `validate(config)` returns `{valid,diagnostics}`; `isValid(config)` returns a boolean. Diagnostics include a stable code and one-based source line/column. Type errors also identify the output row.

## Node, CLI and limits

The portable module has no filesystem access, network calls or dynamic JavaScript evaluation. `zrow-js/node` and the CLI enable `include "relative-file.zrow"`. Includes resolve relative to the including file, remain within baseDir even through symlinks, and must have matching columns/types. Cycles and excessive depth fail. Declare enums, seed and time in the main document. Origins currently expose source lines rather than included filenames.

The CLI infers recipe mode from `.zrow`, literal mode from other extensions, and JSON output from `.json`. `--mode csv|zrow` and `--format csv|json` override inference. Writes are atomic after successful compilation. Errors exit 1 and preserve an existing output file.

Bounds: 1,000,000 input UTF-16 code units including includes; 10,000 output rows; 128 columns; 250,000 cells; 10,000,000 expanded value code units; 100,000 code units per generated value; 4,000 code units / 256 tokens / 40 nesting levels per expression; 10 include levels; 32 unique checks. Bounds apply before callbacks and output writes.

The optional streaming callback runs only after the full document succeeds; it buffers output. Stats count physical input lines and emitted output rows. The alternate `@` directive spelling and earlier versioned controls remain parseable for existing documents. Current examples use the parenthesized syntax.
