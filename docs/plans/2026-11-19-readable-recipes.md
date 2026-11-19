# Readable Recipes Implementation Plan

**Goal:** Make ACSV easier to author, audit and consume through named rows, explicit repetition, deterministic generators, typed columns and JSON output.

**Architecture:** Keep the strict literal CSV mode and legacy `>` recipes. Add a small `@` directive grammar to the existing record scanner; evaluate named overrides with per-row scope in the same bounded interpreter. Keep types and JSON conversion in a portable module, with the browser, CLI and library consuming one compiler contract.

**Tech Stack:** TypeScript, SolidJS, Vitest, Vite; no new runtime dependencies.

## Design contract

```acsv
id:int,email,role,active:bool
@expect 24
@unique id
@set id=seq(),email="user{id}@example.test"
@set role=cycle("member","reviewer"),active=true
@rows 20
@row email="admin@example.test",role=admin
@rows 3 with role=guest,active=false
```

- `@set` sets persistent defaults/formulas, without emitting rows.
- `@row` emits one row; optional named assignments apply only to that row. `@row email=""` deliberately creates an empty string.
- `@rows N` emits exactly N rows. Optional `with name=expression,...` overrides apply only to that block; defaults continue afterward. Unknown/duplicate columns fail. Overrides resolve together, regardless of assignment order.
- `seq(start=1,step=1)` and `cycle(value,...)` are deterministic expressions indexed from the row at which their rule was declared. Every emitted row advances the index, even when overridden. Reassignment restarts the generator. Date sequences use UTC day steps. No random state, time dependency, external datasets or eval.
- Math helpers `round(value,digits=0)`, `min`, `max`, `clamp`, and `pow` support useful game curves and prices, with finite-number and arity checks.
- Optional unquoted header annotations `:text`, `:int`, `:number`, `:bool`, `:date` validate all emitted values. Ordinary/quoted headers remain strings. Types are removed from CSV headers. JSON preserves declared numbers and booleans; untyped values remain strings. No implicit null conversion.
- `@expect N` asserts total document rows; place after the header to detect truncated generation. `@unique a,b` asserts composite-key uniqueness across the document. Declaration limits bound work.
- CSV literal mode never interprets any of the new syntax. Legacy controls and CSV rows continue working.

## Tasks

1. Add failing feature tests in `tests/readable-recipes/test.mjs` and `tests/typed-output/test.mjs`: scoped named rows, dependency resolution, generator reset/index behavior, date boundaries, invalid syntax, type errors, JSON types, uniqueness, row counts, literal escaping and legacy mixing.
2. Extend `src/csv.ts`, `src/expression.ts` and `src/ACSVTranspiler.ts`; create `src/schema.ts`. Add public `toRecords` and `serializeJSON` functions. Run new and existing tests to green.
3. Update `src/ACSV.ts` for `--format csv|json`, inferred from output extension, retaining atomic writes. Extend real CLI tests and browser-without-Node tests.
4. Update editor examples and guide in `src/exampleACSV.ts` and `src/ACSVEditor.tsx`. Add JSON preview/export, typed header badges, measured character comparison, and a copyable short LLM authoring guide. Preserve saved drafts and exports on errors.
5. Rewrite README, feature status, working examples and core contract around the new notation; document older notation as supported. Provide a concise LLM guide and portable conformance vectors. Record design sources and limitations.
6. Measure representative app/game recipe size versus expanded CSV and JSON; report actual character/token measurements with tokenizer and sample sizes, not universal savings claims.
7. Run `npm test`, golden fixtures, build, package imports, documented examples and CLI exports. Verify the production editor in the in-app browser (new syntax, types, JSON, copy/download, errors, mobile) and save screenshots.

## Design references

- TOON's explicit field lists and counts support structural validation: https://toonformat.dev/guide/format-overview . ACSV's distinct opportunity here is expressing a repeatable recipe, rather than only serializing already-expanded data.
- JSON Schema defines explicit primitive types: https://json-schema.org/understanding-json-schema/reference/type . ACSV will use simple declarations and avoid guessing types from cell contents.
- Faker documents reproducibility dependencies on version and relative dates: https://fakerjs.dev/guide/usage.html . This pass uses portable deterministic sequences/cycles, not external fake-data catalogs.

These references inform design choices; no claim of superior LLM accuracy or cross-language implementation is made without evaluation.

## Completed verification

- `npm test`: **120 tests passed across 36 files**, with no skips. New tests cover named/scoped rows, generator indexing/reset, type validation, assertions, JSON/CLI output, portable vectors, documentation and include compatibility.
- `npm run test:acsv`: **20 existing golden fixtures passed**. Legacy syntax remains covered.
- `npm run build` succeeded; post-build package exports return typed JSON correctly. `git diff --check` passed.
- Limited Vitest to four workers after the unrestricted thread pool hit startup/CLI timeouts on this machine. The bounded run completes successfully without increasing assertion timeouts.
- Production editor tested in the Codex in-app browser: retained legacy draft; new app/game recipes; typed JSON; copy and download; LLM guide copy; type/count/uniqueness failures and recovery; CSV export after JSON rejects duplicate headers; source tracing; persisted JSON format; desktop and 375px mobile layout. No browser console warnings/errors or page overflow.
- Downloaded app-fixture JSON verified from disk: 25 objects, numeric IDs, boolean flags and an explicit empty email.
- Token experiment reproduced with tiktoken 0.14.0. Raw measurements and limitations are in `docs/benchmarks/2026-11-19-readable-recipes.json` and `docs/size-experiment.md`. The new regular-row syntax costs six more tokens than legacy notation; benefits are readability, named overrides and contracts. Full LLM guide overhead is included separately.
- Screenshots: task workspace `artifacts/acsv-readable-recipes-desktop.jpg` and `artifacts/acsv-readable-recipes-mobile.jpg`.
- Local preview remains http://127.0.0.1:4174/. No push, publication or deployment was performed.
