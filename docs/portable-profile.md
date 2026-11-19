# Portable implementation profile

The shipping implementation is TypeScript and runs in browsers and Node. CSV and JSON outputs can be consumed by other languages. No Python/Rust implementation or independent cross-language equivalence has been claimed.

The language contract is [core.md](core.md). Machine-readable, independently specified examples are in [conformance vectors](../tests/conformance/vectors.json); `tests/conformance/test.mjs` executes them. A port should also run the full CSV and recipe test corpus.

## Grammar outline

```ebnf
recipe      = version, { declaration }, header, { comment | blank | csv_record | form | include } ;
version     = "# ZROW 0.3" ;
header      = "(cols ", columns, ")" ;
form        = "(", assignments, ")"
            | "(row", [ " ", assignments ], ")"
            | "(rows ", count, [ " with ", assignments ], ")"
            | "(expect ", count, ")"
            | "(unique ", column, { ",", column }, ")" ;
assignments = column, "=", expression, { ",", column, "=", expression } ;
annotation  = ":text" | ":int" | ":number" | ":bool" | ":date" | ":", enum_name ;
declaration = enum_declaration | seed_declaration | time_declaration ;
count       = digit, { digit } ;
```

This outline is not a replacement for the full quoted-field scanner and bounded expression grammar in the contract. A comma separates assignments only outside strings and parentheses. No indentation changes meaning. Unknown directives, functions, types, fields and duplicate assignments are errors.

## Evaluation order

1. Read/validate the header. Output column order is header order.
2. Process directives in source order. A rule captures the current output-row count at declaration.
3. To emit a row, make all explicit CSV values and named overrides available before resolving defaults.
4. Resolve fields lazily with dependency-cycle detection; cache each resolved value for that row.
5. Evaluate `seq`/`cycle` with zero-based index `current output count − rule declaration count`. Overrides do not pause other generators. Each temporary block captures its own declaration count.
6. Check declared types. Store the row and its resolved values for `prev`.
7. After all records, check row count and unique keys. Only then deliver callbacks or write output.

Use exact decimal integer checks in the inclusive range −9007199254740991 to 9007199254740991. Date sequences are UTC calendar days, years 0000–9999; they do not depend on local time. Version 0.3 clock helpers use one captured UTC instant; pin referenceTime or a time declaration for reproducibility. Booleans are case-sensitive `true`/`false`. JSON strings remain strings unless their column is explicitly typed. Treat all object keys as data, including `__proto__` and `constructor`.

The reference uses IEEE-754 binary64 arithmetic and ECMAScript number/string rendering. `round` is multiply, round half toward positive infinity, divide. Floating-point transcendental results (including `pow`) and Unicode case conversion can depend on runtime implementations/data versions. A future strict cross-language profile should pin these details before promising byte-identical floating-point output across independent ports; integer, literal, cycle and UTC-date vectors avoid that ambiguity.

CSV uses commas, doubled quotes, LF record separators and no final newline for generated output. Literal CSV returns the exact original text. JSON export defaults to two-space indentation; compact output is available through `serializeJSON(result,false)`. Whitespace in JSON is not a conformance requirement.

Diagnostics use stable codes and one-based source locations; column offsets and resource limits currently count UTF-16 code units. Tests assert codes/locations, not locale-specific error prose. Enforce the contract's bounds before producing partial output. Filesystem includes belong in an explicit host adapter, not the portable expression evaluator.

## Version 0.3 context and randomness

Named enums are text membership constraints checked for every emitted row and JSON conversion. Lists are expanded into literal arguments for cycle/choice. The seeded hash, draw indexing, rejection sampling and time rules are specified in [enums and generators](generators.md). Seeded draws depend on the column name, rule-relative row index, expression call ID and local draw index, not mutable evaluation order. Normal and geographic functions use binary64 transcendental math and can differ in their last digits across independent runtimes.
