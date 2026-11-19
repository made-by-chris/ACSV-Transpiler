# Feature status

The executable contract is [docs/core.md](docs/core.md). Historical feature IDs remain in tests for traceability.

| Area | Supported |
| --- | --- |
| CSV | Literal default mode, exact byte preservation, quotes/multiline fields, BOM/newlines, strict row width |
| Named recipes | `@set`, `@row`, `@rows N`, scoped `@rows N with ...`; no empty placeholder rows required |
| Generators | `seq(start,step)` for numbers/dates; deterministic `cycle(...)`; explicit restart/index semantics |
| Math and formulas | Current-row refs, lazy `if`, `prev`, templates, case helpers, padding, UTC dates, `round`, `pow`, `min`, `max`, `clamp` |
| Types | Optional text/int/number/bool/date headers; validation with output-row/source locations |
| Assertions | Expected row count and single/composite unique keys |
| Exports | CSV and typed JSON; `toRecords` and `serializeJSON`; CLI format inference/override |
| Legacy | Existing `>` assignments, counters, STOP, repeats, ranges and exact-width CSV rows |
| Node includes | Header/type matching, confined paths, cycle/depth/size checks |
| Runtime | Browser/Node ESM core, validation, cell origins, bounds, atomic CLI output, successful-row callbacks |
| Editor | Table/CSV/JSON preview, app/game recipes, typed badges, source tracing, drafts, undo, downloads, phone layout |
| Porting | Documented semantics and language-neutral conformance vectors; only the TypeScript implementation is provided |

## Still deferred

Randomness, seeds, Faker catalogs, nullable generators, nested scopes/tables, custom dialects, spreadsheet-safety transformations, and asynchronous constant-memory streaming. Historical implicit group syntax remains unsupported; explicit row/block overrides now provide a small, well-defined scope mechanism.

Original aspirational examples remain in [roadmap-fixtures](docs/roadmap-fixtures/). Their rejection tests have not been silently removed to advertise those proposals as working features.
