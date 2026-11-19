# Parameters, functions and related tables

Use `# ZROW 0.4` with `zrow-js` 0.6.0 or later. Existing single-table documents keep their syntax and output shape. Version 0.1–0.3 declarations remain supported, but cannot opt into these new declarations.

## Parameters

```zrow
# ZROW 0.4
(param count:int=6)
(param first_id:int=1001)
(param prefix:text="Customer")
(cols id:int,name)
(id=seq(first_id),name="{prefix} {id}")
(rows count)
(expect count)
```

Parameters are typed, immutable inputs with required defaults. Types are `text`, `int`, `number`, `bool` and `date`. Defaults may use earlier parameters and pure expressions. Parameters can appear in formulas, templates, row counts and expectations. Seed/time declarations also accept a parameter directly.

Caller overrides must have the appropriate JSON primitive type: numbers for int/number, booleans for bool, strings for text/date. Integers must be safe integers; dates must be valid ISO dates. Unknown parameter names are rejected. Override values are data, not executable source or templates. Declare parameters before any table header.

```js
import { compile } from 'zrow-js';
const result = compile({ input, mode: 'zrow', params: { count: 20, prefix: 'Member' } });
console.log(result.csv);
```

The editor uses the defaults written in the recipe; edit those declarations to change its inputs. The API accepts `params` in the request body. The CLI accepts a JSON object:

```sh
zrow --params '{"count":20,"prefix":"Member"}' customers.zrow customers.csv
```

## Reusable functions

```zrow
# ZROW 0.4
(fn discounted(price,percent)=round(price*(1-percent/100),2))
(fn customer_code(id)="CUS-"+pad(id,5))
(cols id:int,code,price:number,sale_price:number)
(id=seq(),code=customer_code(id),price=cycle(19.99,49.99,99.99))
(sale_price=discounted(price,15))
(rows 6)
```

A function has an explicit argument list and one expression. Arguments are evaluated once at the call site. Its body can use arguments, earlier parameters, earlier functions and pure helpers: `if`, `pad`, `formatDate`, `round`, `min`, `max`, `clamp`, `pow`, arithmetic, comparisons, templates and case conversion. Templates inside a function may reference its arguments or earlier parameters.

Functions cannot implicitly read current-row columns or table lists. Recursion, forward function calls, row generators, random functions, clock helpers and `prev` are not allowed inside a function body. Pass generated values as arguments instead, such as `discounted(randInt(100,500),10)`. Functions return scalar values; the destination column validates its type. Definitions precede table headers. Names must be distinct and must not shadow built-ins, parameters or other declarations. Arguments cannot shadow those names either.

## Named tables and foreign keys

```zrow
# ZROW 0.4
(param customer_count:int=4)
(param order_count:int=12)
(seed 42)

(table customers
  (cols id:int,name)
  (unique id)
  (id=seq(),name="Customer {id}")
  (rows customer_count)
)

(table orders
  (cols id:int,customer_id:int,total_cents:int)
  (unique id)
  (ref customer_id=customers.id)
  (id=seq(),customer_id=choice(customers.id))
  (total_cents=randInt(500,25000))
  (rows order_count)
)
```

A table opens with `(table name` on its own line and closes with `)` on its own line. Forms still occupy one physical line. Indentation inside a table is layout: leading spaces at the start of each new record are stripped; quote a literal CSV field if leading spaces are data. Newlines and indentation inside quoted multiline CSV fields are preserved. Do not mix unwrapped rows with table blocks or nest table blocks.

Tables compile in declaration order. `customers.id` means the values from a column in an earlier, completed table. `choice(customers.id)` samples those values with the document seed; `cycle(customers.id)` cycles through them in row order. Empty table columns cannot be sampled. Lists are only accepted as the sole argument of choice/cycle; they are not scalar expressions. Their size is bounded by the dataset row limit, rather than the 32-argument enum/list limit.

`(ref customer_id=customers.id)` validates all emitted foreign-key values, including literal CSV and row overrides. The local and referenced columns must have the same primitive type. The target values must be unique under typed comparison; numeric `001` and `1` are the same key. A target does not need a separate `unique` declaration because `ref` verifies its uniqueness itself. There are no null foreign keys, implicit joins or cascading updates.

Parameters, functions, enums, seed and time are global declarations above all tables. Each table has its own defaults, sequence indices, previous row and constraints. All tables share one reference time. Include files remain available for single-table documents only; named-table documents do not allow includes.

## Output

`compile` returns the usual `Compilation` for a single unwrapped table. A named-table document returns a `Compilation` with a `tables` map and aggregate statistics. Its top-level headers/columns/rows/origins are empty; reading its top-level `csv` throws `E_TABLE_SELECT` to prevent accidental partial exports.

```js
import { compile, selectTable, serializeJSON } from 'zrow-js';
const dataset = compile({ input, mode: 'zrow', params: { order_count: 20 } });
const customersCSV = selectTable(dataset, 'customers').csv;
const ordersCSV = selectTable(dataset, 'orders').csv;
const allTablesJSON = serializeJSON(dataset);
```

Dataset JSON is an object whose keys are table names and values are arrays of typed records. `toRecords` requires a selected table. `serializeJSON(selectTable(dataset,'orders'))` exports just that table.

The editor's table selector controls CSV and table previews; JSON preview/download includes every table. Download each table's CSV separately, or one JSON file for the whole dataset.

```sh
zrow --table customers shop.zrow customers.csv
zrow --table orders shop.zrow orders.csv
zrow shop.zrow shop.json
```

The API accepts `table` for a selected-table export. It is required for CSV from named-table documents. JSON without `table` returns the complete dataset. Responses include `tables` metadata when applicable, and `rows` counts the selected output or the entire dataset. CSV requests never implicitly pick the first table.

## Bounds and validation

The existing 1,000,000 input-character, 10,000 row, 250,000 cell and 10,000,000 output-character limits apply across a dataset. Up to 32 tables, 32 references per table, 128 parameter/function/enum declarations before tables, 16 arguments per function, 32 nested calls and 10,000 expression evaluation steps per cell are allowed. Names use ASCII identifiers, at most 64 characters for declarations. Row counts must evaluate to non-negative safe integers.

All tables and references are validated before any output or statistics callback. Streaming callbacks are available only for single-table documents. Compiler diagnostics preserve original source line numbers, including indented table blocks.
