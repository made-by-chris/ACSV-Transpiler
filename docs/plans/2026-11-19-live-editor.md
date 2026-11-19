# Live Editor Repair Implementation Plan

> Execute this plan in the current checkout as requested by the user.

**Goal:** Restore CSV generation in the web editor and verify both the development server and production build in a browser.

**Architecture:** Keep the shared transpiler and its Node CLI/library behavior. Guard Node-only defaults, explicitly reject filesystem includes in the browser, and keep editor errors recoverable. Use a single valid default document matching the current `>` control-line syntax.

**Tech Stack:** TypeScript, SolidJS, Vite, Vitest.

---

### 1. Reproduce and establish the baseline

- Clone to `/Users/basiclaser/projects/ACSV-Transpiler` and install the lockfile with `npm ci`.
- Verify `https://acsv.vercel.app/` with plain CSV and inspect browser errors.
- Run `npm test` and `npm run build` before edits.
- Observed: live output stays blank with `ReferenceError: process is not defined`. The baseline test suite has 25 failures and 4 passes, including unsupported features and old syntax; retain that baseline when checking for regressions.

### 2. Add browser regression coverage

**Create:** `tests/browser-runtime/test.mjs`.

- Run the compiled transpiler without a global `process`, with plain CSV and explicit `>` controls.
- Assert the exact CSV output, and verify browser filesystem includes fail with a useful message while Node includes still work.
- Run `npm run build:lib && npx vitest run tests/browser-runtime/test.mjs`; first confirm the missing-process failure, then rerun after the repair.

### 3. Repair the editor

**Modify:** `src/ACSVTranspiler.ts`, `src/ACSVEditor.tsx`, `src/exampleACSV.ts`, and `vite.config.ts` if required by the build.

- Guard the `process.cwd()` fallback so plain browser transpilation does not depend on Node.
- Handle filesystem includes explicitly in the browser and surface errors in an accessible alert, clearing stale output and allowing the next edit to recover.
- Use non-streaming, quiet transpilation for the editor; preserve intentionally empty saved input.
- Replace the mixed-header tutorial with a coherent single-table example and test its exact output.
- Remove invalid build configuration only if verified by the build.
- Repair observed extra-row generation: emit once per data row, apply increments afterward, and make STOP retain the last emitted value. Correct two existing fixtures to honor that documented contract (three rows mean three rows; a template control needs a data row).
- Fix the toolbar Copy action to use the Clipboard API and report failure honestly; release download object URLs after use.

### 4. Verify the result

- Run targeted regression tests, the full suite against the recorded baseline, and production and CLI builds.
- Run the CLI with a small temporary input and inspect its CSV output.
- In the in-app browser, test initial output, live edits, empty input and reload, unsupported include recovery, Copy, and Download.
- Repeat core browser checks against the production preview, save a screenshot, and leave a local preview available.
- Review `git diff --check` and summarize the fix, test results, and whether the public deployment was updated.

## Verification results

- Public site reproduced a blank output and `ReferenceError: process is not defined`.
- Initial production build failed resolving the boolean `false` filesystem aliases.
- All six browser-runtime regression tests pass; the CLI smoke test and production build pass.
- Full suite: 18 passing tests and 17 failing tests. All remaining failing test names were already failing on the unmodified checkout. Two corrected fixtures now reflect explicit data-row emission. The broader compiler suite is not green.
- Development and production browser checks passed: initial example, live edits, graceful include error and recovery, empty-document persistence, Copy, Download, and reload. Production console contained no errors or warnings. Downloaded CSV contents match the displayed output.
- Production preview: http://127.0.0.1:4173/. Public deployment has not been changed.
