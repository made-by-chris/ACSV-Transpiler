# ACSV Feature Compendium

This index enumerates language/runtime features to drive TDD. Each entry has an ID, brief spec, example, and status.

Legend: [status] planned | in_progress | implemented | blocked

## L1 Basics
- ID: L1.1 Headers and data rows — [implemented]
  - Spec: First non-comment line is header; subsequent data lines produce CSV rows.
  - Example: `id,name` + `1,Jane`
- ID: L1.2 Comments — [implemented]
  - Spec: Lines starting with `#` are ignored.
- ID: L1.3 Control indicator — [implemented]
  - Spec: A blank line marks the next line as a control line.

## L2 Control operators
- ID: L2.1 Assignment `col=value` — [implemented]
  - Spec: Sets column value for following data rows.
- ID: L2.2 Increment one-shot `col+` and decrement `col-` — [implemented]
  - Spec: Adjusts state once at control application time.
- ID: L2.3 Accumulating `col++` and `col--` — [implemented]
  - Spec: Applies per data row until stopped.
- ID: L2.4 STOP `col++STOP` / `col--STOP` — [implemented]
  - Spec: Stops accumulation.

## L3 Language ergonomics
- ID: L3.1 Row repeat `xN` — [planned]
- ID: L3.2 Ranges `a..b` — [planned]
- ID: L3.3 Step/unit increments `++N`, `++1d` — [planned]
- ID: L3.4 Column refs and expressions — [planned]
- ID: L3.5 prev()/row()/col() helpers — [planned]
- ID: L3.6 Conditionals `if(cond,a,b)` — [planned]
- ID: L3.7 Templates `{name}` and string ops — [planned]
- ID: L3.8 Format helpers `pad`, `upper/lower` — [planned]
- ID: L3.9 Dates format/arithmetic — [planned]
- ID: L3.10 Null control `maybe(null,p)` — [planned]
- ID: L3.11 Groups/scopes for controls — [planned]
- ID: L3.12 Includes `include "file"` — [planned]

## L4 Random & data gen
- ID: L4.1 Seed control — [planned]
- ID: L4.2 randInt/randFloat — [planned]
- ID: L4.3 choice/choiceWeighted — [planned]
- ID: L4.4 Faker-like deterministic data — [planned]

## L5 CSV/dialect/safety
- ID: L5.1 CSV dialect flags (delimiter, quote, newline) — [planned]
- ID: L5.2 Excel injection safety mode — [planned]

## L6 API/CLI/runtime
- ID: L6.1 Streamed generation API — [planned]
- ID: L6.2 Validation `validate` and `isValid` — [planned]
- ID: L6.3 CLI: transpile/validate/preview — [planned]
- ID: L6.4 Diagnostics: errors/warnings with row/col — [planned]

---

Process: For each feature, add test vectors under `tests/<feature-id>/` with `input.acsv`, `expected.csv`, and optional `config.json`. Implement minimal code to make tests pass.
