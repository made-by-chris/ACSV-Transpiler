# Reliable Core and Usable Editor Implementation Plan

**Goal:** Make CSV preservation and the existing deterministic ACSV core reliable, then build an editor for app fixtures and game data.

**Architecture:** Separate literal CSV parsing/serialization, a restricted expression interpreter, and ACSV rule execution. Keep filesystem access in a Node adapter. The editor consumes the same structured compilation result used by the CLI and tests.

**Tech Stack:** TypeScript, SolidJS, Vite, Vitest; no additional language features or runtime dependencies.

## Contract and tests first

- Create `docs/core.md` with explicit CSV/ACSV modes, literal data cells, quoted-empty overrides, rule semantics, exact row widths, deterministic dates, diagnostics and output limits.
- Add `tests/csv-compatibility/test.mjs` for quotes, multiline records, spaces, CRLF, BOM, literal operators, malformed input and round trips.
- Add `tests/core-contract/test.mjs` for per-row formulas, cycle/unknown-name errors, safe evaluation, limits, sequences, dates, ranges, repeats and cell origins.
- Preserve roadmap-only fixtures under `docs/roadmap-fixtures/`. Replace their misleading output assertions with explicit unsupported-feature rejection tests. Do not implement randomness, Faker, new scopes, dialect directives, or spreadsheet safety directives in this pass.
- Correct existing supported fixtures to use explicit `>` controls and one output row per data row; distinguish intentional migrations from bug fixes in documentation.

## Core implementation

- Create `src/csv.ts`: strict record scanner and serializer, preserving literal CSV bytes in CSV mode.
- Create `src/expression.ts`: bounded, whitelisted expression parsing/evaluation; no JavaScript evaluation.
- Rewrite `src/ACSVTranspiler.ts`: deterministic execution, diagnostics, validation and source mapping; no Node imports.
- Create `src/node.ts`: opt-in, bounded relative file includes.
- Update `src/ACSV.ts`: explicit CLI modes, proper exit codes, atomic successful output, clear errors.
- Fix both test runners and build outputs so library builds and the website coexist.
- Run core tests until all are passing before changing the editor.

## Editor implementation after the core is green

- Update `src/ACSVEditor.tsx`, `src/App.tsx`, `src/UtilityBar.tsx`, `src/exampleACSV.ts`, and `src/App.css`.
- Clearly label ACSV / literal CSV input, table / CSV output, source copying versus CSV export.
- Provide app fixtures and game progression examples using only the supported core.
- Show row/column counts, bounded table previews, diagnostics with source locations, generated cell provenance, and selection of the source rule.
- Preserve drafts and empty documents; undo example replacement; disable exports for invalid input.
- Keep layout usable on narrow screens and keyboard accessible.

## Verification and delivery

- Run `npm test`, `npm run test:acsv`, CLI smoke checks, and production build.
- Exercise the actual production preview in the in-app browser: examples, mode switching, quote/newline preservation, errors/recovery, provenance, copy, download, persistence, and responsive layout.
- Save screenshots, inspect the final diff, and leave the local preview available.
- Document supported/deferred features accurately; do not publish automatically.

## Completed verification — 2026-11-19

- Core passed 67 tests and all 20 golden fixtures before editor implementation began.
- Final `npm test`: **71 passed across 32 files**, no skips or failures.
- Final `npm run test:acsv`: **20 golden fixtures passed**.
- `npm run build`: library, CLI, TypeScript and production website all succeeded. Build outputs coexist; package self-imports verified after the website build.
- All four documented ACSV/CSV example pairs matched compiled output.
- `git diff --check` passed.
- Production preview exercised in the Codex in-app browser: app and game examples; literal operators and multiline fields; cell origins and source selection; copy source/CSV; downloaded CSV content; malformed quotes and recovery; disabled invalid exports; clear/undo; title, mode and empty draft persistence; 250-row generation with a 100-row table preview and all 250 rows in output.
- Responsive checks at 1280 and 375 CSS pixels found no page overflow. Narrow-screen example loading and CSV view worked. Browser console had no warnings or errors.
- Screenshots saved in the task workspace's `artifacts/acsv-workbench-desktop.jpg` and `artifacts/acsv-workbench-mobile.jpg`.
- Preview left at http://127.0.0.1:4174/. Changes are local; no deployment or push was performed.

The original aspirational fixtures remain in `docs/roadmap-fixtures/`. Their active tests now assert unsupported syntax errors. Supported golden fixtures were corrected to the explicit syntax and row-count contract; this migration is documented in `docs/core.md`.
