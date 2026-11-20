<p align="center">
  <img src="https://raw.githubusercontent.com/made-by-chris/zrow/main/docs/logo.svg" alt="ZROW" width="192" height="192">
</p>

# ZROW

**CSV-as-a-programming-language.**

ZROW extends CSV with formulas, parameters, reusable functions and data generators. Write a short program to generate a dataset, then export ordinary CSV or typed JSON. Use it through the JavaScript library, CLI, [live editor](https://zrow.majaku.com) or conversion API.

Unlike regular CSV, a ZROW document can contain multiple named tables and relationships between them. Export each table as a separate CSV file, or export all tables together as JSON.

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

This program produces six rows. Assignments define defaults, `(rows N)` generates rows, and `(row ...)` supplies named overrides. Numeric and boolean types are preserved in JSON. CSV output contains the generated headers and rows.

[Language reference](docs/core.md) · [Authoring guide](docs/authoring.md) · [Examples](examples.md) · [Feature status](FEATURES.md) · [Enums and generators](docs/generators.md) · [Portable profile](docs/portable-profile.md) · [Parameters, functions and tables](docs/programs.md)

## Install

```sh
npm install zrow-js
npx zrow users.zrow users.csv
npx zrow users.zrow users.json
```

## Multiple tables

Define customers and orders in one document. Each order references an existing customer ID:

```text
# ZROW 0.4
(table customers
  (cols id:int,name)
  (id=seq(),name="Customer {id}")
  (rows 3)
)
(table orders
  (cols id:int,customer_id:int,total:number)
  (ref customer_id=customers.id)
  (id=seq(),customer_id=cycle(customers.id),total=49.99)
  (rows 6)
)
```

Save this as `shop.zrow`. Export the tables as individual CSV files, or keep the entire dataset in one JSON file:

```sh
zrow --table customers shop.zrow customers.csv
zrow --table orders shop.zrow orders.csv
zrow shop.zrow shop.json
```

The compiler checks that every order's `customer_id` exists in `customers.id`. The editor has a table selector for CSV previews and downloads; its JSON download includes all tables. See [parameters, functions and tables](docs/programs.md) for library and API usage.

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

The default input mode is literal CSV, which preserves valid input without interpreting ZROW syntax. Use `mode: "zrow"` to compile ZROW programs. The optional `# ZROW 0.4` declaration identifies the language version independently of the npm package version. Unsupported, malformed, repeated or misplaced declarations are rejected.

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

Add comments next to the instructions:

```text
# ZROW 0.4
(cols id:int,name)          # two columns
(id=seq(),name="User {id}") # number each name
(rows 6)                   # generate six rows
```

Comments after instructions do not appear in the output. Hashes in quoted strings and literal CSV fields remain data.
