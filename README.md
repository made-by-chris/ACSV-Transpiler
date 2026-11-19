# ACSV — readable data recipes

Generate predictable app fixtures and game tables without repeating every value or counting empty comma cells. Name the pattern, then name the exceptions.

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

This produces six ordinary CSV rows or six JSON objects with numeric IDs and boolean `active` values. Named overrides affect only their rows. Adding a column does not shift an override into the wrong field.

- **Readable:** `@set`, `@row`, `@rows`; optional comments and literal CSV rows.
- **Expressive:** sequences, cycles, per-row formulas, conditions, dates, rounding and bounded game curves.
- **Checkable:** optional types, expected row counts, unique keys, source diagnostics and cell tracing.
- **Portable output:** CSV, typed JSON, an ESM library, a Node CLI and a browser editor using the same core.
- **Useful for LLMs:** a copyable authoring guide, explicit generation counts and validation. Size savings depend on the data; see the [measured examples](docs/size-experiment.md).

[Working examples](examples.md) · [Language contract](docs/core.md) · [LLM guide](docs/llm-guide.md) · [Feature status](FEATURES.md) · [Portable profile](docs/portable-profile.md)

## Run locally

```sh
npm ci
npm run dev
npm test
npm run test:acsv
npm run build
npm run preview
```

The editor offers app/game examples, table/CSV/JSON previews, explicit input/export modes, typed headers, cell-to-source tracing, saved drafts, undo replacement, and source/data copy/download. The table previews the first 100 rows; exports include all output. Processing stays on your device.

Library files live in `dist/`, CLI files in `cli/`, and the website in `dist/web/`. The public [editor](https://acsv.majaku.com/) and [conversion API](https://acsv.majaku.com/api/) run on Cloudflare.

## Install the released package

The short npm name `acsv` was rejected by npm because it is too similar to `a-csv`. A replacement registry name is being selected. For now, use the [GitHub release package](https://github.com/made-by-chris/ACSV-Transpiler/releases/tag/v0.1.0):

```sh
npm install acsv@https://github.com/made-by-chris/ACSV-Transpiler/releases/download/v0.1.0/acsv-transpiler-0.1.0.tgz
```

Run the installed CLI with `npx acsv users.acsv users.csv`.

The installed library exports `compile`, `validate`, `serializeJSON` and `toRecords` from `acsv`. The release package is versioned and the website API reports its version in responses.

## CLI

```sh
node cli/ACSV.js users.acsv users.csv
node cli/ACSV.js users.acsv users.json
node cli/ACSV.js --mode acsv --format json recipe.txt output.txt
node cli/ACSV.js existing.csv unchanged.csv
```

`.acsv` selects recipe mode; `.json` output selects JSON. Failed compilation or conversion leaves the output file untouched.

## Library

The GitHub installation above exposes the portable core as `acsv`:

```js
import { compile, toRecords, serializeJSON, validate } from 'acsv';
const input = 'id:int,active:bool\n@set id=seq(),active=true\n@rows 3';
const result = compile({ input, mode: 'acsv' });
console.log(result.csv);
console.log(toRecords(result)); // [{ id: 1, active: true }, ...]
console.log(serializeJSON(result));
console.log(validate({ input, mode: 'acsv' }));
```

The default export still returns CSV text. The default **input** mode is literal CSV: it never interprets formulas or directives and returns valid input unchanged. File includes require the explicit `./dist/node.js` adapter (package export `acsv/node`); the portable core has no filesystem access or dynamic JavaScript evaluation.

## Compatibility

Existing `>` controls and ordinary CSV rows continue working. New recipes can use named directives throughout. `@` lines and unquoted `:type` header annotations are now reserved in ACSV mode; quote literal fields that resemble them. See the [contract](docs/core.md) for complete behavior and limits.

Created by Christopher Shelley. [MIT license](LICENSE).

## Maintainer and contributions

[Christopher Shelley on X](https://x.com/househuman) · [GitHub](https://github.com/made-by-chris) · [majaku](https://majaku.com). See [CONTRIBUTING.md](CONTRIBUTING.md) for bug reports and review expectations.

## Guides

- [App fixtures with named exceptions](https://acsv.majaku.com/guides/app-fixtures/)
- [Game progression tables](https://acsv.majaku.com/guides/game-data/)
- [Reading generated CSV in Python](https://acsv.majaku.com/guides/python/)
- [Conversion API and limits](https://acsv.majaku.com/api/)
