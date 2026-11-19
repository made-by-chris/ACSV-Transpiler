# Preserved proposals

These input/output pairs came from the original aspirational test suite. They describe ideas, not supported syntax or verified output. They are preserved for future design work, outside the executable golden-fixture runner.

The matching active test directories now check that unsupported features fail explicitly. No tests are skipped. `legacy-diagnostics` preserves an old fixture that silently ignored an unknown column; the active test now expects a source diagnostic instead.

Supported fixtures were migrated to explicit `>` controls, exact header widths, explicit output rows, and explicit date increments. These are intentional contract corrections, documented in `../core.md`, not evidence that the previous speculative syntax worked.
