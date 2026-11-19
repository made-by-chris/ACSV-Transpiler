# ZROW

ZROW is the CSV programming language. Create data with parameters, reusable functions and linked tables, then export ordinary CSV or typed JSON. People and LLMs can describe large datasets with compact recipes, then compile them into CSV and typed JSON. It includes a JavaScript library, a command-line tool, a browser editor and a conversion API.

```text
# ZROW 0.4
(cols id:int,email,role,active:bool)
(expect 6)
(unique id)
(id=seq(),email="user{id}@example.test")
(role=member,active=true)
(rows 3)
(row email="admin@example.test",role=admin)
(rows 2 with role=guest,active=false)
```

This recipe produces six rows. Assignments define defaults, `(rows N)` generates rows, and `(row ...)` supplies named overrides. Numeric and boolean types are preserved in JSON. CSV output contains ordinary fields and no recipe directives.

[Language reference](docs/core.md) · [Authoring guide](docs/authoring.md) · [Examples](examples.md) · [Feature status](FEATURES.md) · [Enums and generators](docs/generators.md) · [Portable profile](docs/portable-profile.md) · [Parameters, functions and tables](docs/programs.md)

## Install

```sh
npm install zrow-js
npx zrow users.zrow users.csv
npx zrow users.zrow users.json
```

## JavaScript

```js
import { compile, toRecords, serializeJSON, validate } from 'zrow-js';

const input = '# ZROW 0.4\n(cols id:int,active:bool)\n(id=seq(),active=true)\n(rows 3)';
const result = compile({ input, mode: 'zrow' });
console.log(result.csv);
console.log(toRecords(result));
console.log(serializeJSON(result));
console.log(validate({ input, mode: 'zrow' }));
```

The default input mode is literal CSV, which preserves valid input without interpreting recipe syntax. Use `mode: "zrow"` to compile recipes. The optional `# ZROW 0.4` declaration identifies the language version independently of the npm package version. Unsupported, malformed, repeated or misplaced declarations are rejected.

The portable core has no filesystem access or dynamic JavaScript evaluation. The `zrow-js/node` adapter enables confined file includes.

## Examples

The [example gallery](https://zrow.majaku.com/examples/) groups small keyword/function examples separately from practical use cases. Use cases cover catalogues, schedules, synthetic readings, invoice lines, test matrices, collection templates, shipping bands and inventory imports. Recipes live in `content/gallery.json` and are compiled during the site build.

## Enums, randomness and time

```text
# ZROW 0.4
(enum Status "trial","active","paused")
(seed 42)
(time "2026-11-19T12:00:00Z")
(cols id:int,status:Status,day:date,latitude:number,longitude:number)
(id=seq(),status=choice(Status),day=seq(today(),1))
(latitude=round(latitude(52.4,52.6),6),longitude=round(longitude(13.2,13.6),6))
(rows 10)
```

Enums validate every generated or literal value. Seeded random generators include `rand`, `randInt`, `normal`, `choice` and `choiceWeighted`. Clock helpers include `today`, `now`, `tomorrow` and `yesterday`. Use a fixed time as well as a seed when the whole output must repeat. The library and API accept `seed` and `referenceTime` options instead of document declarations. See [generator semantics](docs/generators.md).


## Editor and API

The [editor](https://zrow.majaku.com/) runs locally in your browser and stores drafts on your device. It previews tables, CSV and JSON and exports the full generated output. The table preview displays the first 100 rows.

The [conversion API](https://zrow.majaku.com/api/) runs on Cloudflare. Its [OpenAPI schema](https://zrow.majaku.com/openapi.json) documents requests, limits and diagnostics. The [agent index](https://zrow.majaku.com/llms.txt) links to machine-readable documentation.

## Run locally

```sh
npm ci
npm run dev
npm test
npm run test:zrow
npm run build
npm run preview
```

`src/` contains the compiler and editor. `worker/` contains the conversion API. `tests/` contains compatibility, conformance and browser/Node runtime checks. `docs/` contains the language documentation. Builds generate `dist/` and `cli/`; generated files are excluded from Git.

Changes to language behavior should include tests and compatibility notes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and maintainer

[MIT](LICENSE). Maintained by [Christopher Shelley](https://x.com/househuman) at [Majaku](https://majaku.com).

### Inline comments

Explain a recipe next to the instructions:

```text
# ZROW 0.4
(cols id:int,name)          # two columns
(id=seq(),name="User {id}") # number each name
(rows 6)                   # generate six rows
```

Comments after instructions do not appear in the output. Hashes in quoted strings and literal CSV fields remain data.
