# ZROW

ZROW compiles data recipes into CSV and typed JSON. It includes a JavaScript library, a command-line tool, a browser editor and a conversion API.

```text
# ZROW 0.1
id:int,email,role,active:bool
@expect 6
@unique id
@set id=seq(),email="user{id}@example.test"
@set role="member",active=true
@rows 3
@row email="admin@example.test",role="admin"
@rows 2 with role="guest",active=false
```

This recipe produces six rows. `@set` defines defaults, `@rows` generates rows, and `@row` supplies named overrides. Numeric and boolean types are preserved in JSON. CSV output contains ordinary fields and no recipe directives.

[Language reference](docs/core.md) · [Authoring guide](docs/authoring.md) · [Examples](examples.md) · [Feature status](FEATURES.md) · [Portable profile](docs/portable-profile.md)

## Install

```sh
npm install zrow-js
npx zrow users.zrow users.csv
npx zrow users.zrow users.json
```

## JavaScript

```js
import { compile, toRecords, serializeJSON, validate } from 'zrow-js';

const input = '# ZROW 0.1\nid:int,active:bool\n@set id=seq(),active=true\n@rows 3';
const result = compile({ input, mode: 'zrow' });
console.log(result.csv);
console.log(toRecords(result));
console.log(serializeJSON(result));
console.log(validate({ input, mode: 'zrow' }));
```

The default input mode is literal CSV, which preserves valid input without interpreting recipe syntax. Use `mode: "zrow"` to compile recipes. The optional `# ZROW 0.1` declaration identifies the language version independently of the npm package version. Unsupported, malformed, repeated or misplaced declarations are rejected.

The portable core has no filesystem access or dynamic JavaScript evaluation. The `zrow-js/node` adapter enables confined file includes. Existing `acsv` and `xcsv` modes, file extensions and the `# XCSV 0.1` declaration remain supported for compatibility.

## Editor and API

The [editor](https://acsv.majaku.com/) runs locally in your browser and stores drafts on your device. It previews tables, CSV and JSON and exports the full generated output. The table preview displays the first 100 rows.

The [conversion API](https://acsv.majaku.com/api/) runs on Cloudflare. Its [OpenAPI schema](https://acsv.majaku.com/openapi.json) documents requests, limits and diagnostics. The [agent index](https://acsv.majaku.com/llms.txt) links to machine-readable documentation.

## Run locally

```sh
npm ci
npm run dev
npm test
npm run test:acsv
npm run build
npm run preview
```

`src/` contains the compiler and editor. `worker/` contains the conversion API. `tests/` contains compatibility, conformance and browser/Node runtime checks. `docs/` contains the language documentation. Builds generate `dist/` and `cli/`; generated files are excluded from Git.

Changes to language behavior should include tests and compatibility notes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and maintainer

[MIT](LICENSE). Maintained by [Christopher Shelley](https://x.com/househuman) at [Majaku](https://majaku.com).
