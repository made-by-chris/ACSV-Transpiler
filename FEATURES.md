# Feature status

The executable contract is [docs/core.md](docs/core.md). Historical feature IDs remain in tests for traceability.

| Area | Supported |
| --- | --- |
| CSV | Literal default mode, exact byte preservation, quotes/multiline fields, BOM/newlines, strict row width |
| Parameters | Typed defaults, validated caller overrides and expressions in row counts |
| Functions | Pure named expressions, explicit arguments, earlier function calls and bounded evaluation |
| Relationships | Named tables, choice/cycle over earlier columns, typed foreign-key validation |
| Named recipes | `(column=value)`, `(row ...)`, `(rows N)`, scoped `(rows N with ...)`; no empty placeholder rows required |
| Generators | `seq(start,step)` for numbers/dates; deterministic `cycle(...)`; explicit restart/index semantics |
| Randomness and geography | Explicit document/config seeds; rand/randFloat, inclusive randInt, normal, choice/choiceWeighted, bounded area-uniform latitude and longitude |
| Clock | One captured UTC instant; today/now/tomorrow/yesterday; explicit time/referenceTime override |
| Math and formulas | Current-row refs, lazy `if`, `prev`, templates, case helpers, padding, UTC dates, `round`, `pow`, `min`, `max`, `clamp` |
| Types | Optional text/int/number/bool/date headers and named text enums; validation with output-row/source locations |
| Assertions | Expected row count and single/composite unique keys |
| Exports | CSV and typed JSON; `toRecords` and `serializeJSON`; CLI format inference/override |
| Legacy | Existing `>` assignments, counters, STOP, repeats, ranges and exact-width CSV rows |
| Node includes | Header/type matching, confined paths, cycle/depth/size checks |
| Runtime | Browser/Node ESM core, validation, cell origins, bounds, atomic CLI output, successful-row callbacks |
| Editor | Table/CSV/JSON preview, general-purpose example gallery, typed badges, source tracing, drafts, undo, downloads, phone layout |
| Porting | Documented semantics and language-neutral conformance vectors; only the TypeScript implementation is provided |

## Still deferred

Faker catalogs, nullable generators, nested table blocks, custom dialects, spreadsheet-safety transformations, and asynchronous constant-memory streaming. Historical implicit group syntax remains unsupported; explicit row/block overrides now provide a small, well-defined scope mechanism.
