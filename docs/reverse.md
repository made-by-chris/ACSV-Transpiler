# CSV and JSON to ZROW

`toZROW({ input, format: "csv" | "json" })` returns a ZROW 0.4 document. It compiles the generated document and verifies that its data matches the input before returning it. Conversion throws a diagnostic when the data cannot be represented.

```js
import { toZROW } from 'zrow-js';
const source = toZROW({input: 'id,name\n001,Ada', format: 'csv'});
```

CSV requires a header and rectangular rows with unique, nonempty column names. Cells remain text, including leading zeros. Quoting and line-ending style may change; cell values do not.

JSON accepts a nonempty array of records or an object mapping table names to such arrays. Columns must have consistent string, number or boolean values. Column and table names must be identifiers. Null, nested values, missing fields, empty tables and unsafe integers are rejected. Object key order is not significant. Numeric values are interpreted using JavaScript JSON parsing; original numeric spelling is not retained.

Conversion produces literal rows. It does not reconstruct formulas, seeds, parameters, enums or foreign-key constraints. Those cannot generally be recovered from their output. No new language syntax is required.

In the editor, choose **Paste CSV / JSON** in the output panel, select the input format, then **Convert to ZROW**. Failed conversions leave the source intact; successful replacements can be undone.

The existing `POST /api/v1/convert` endpoint accepts `{ "input": "...", "mode": "csv", "format": "zrow" }` (or `mode: "json"`). Success returns `{version, format: "zrow", data: "..."}`. Unsupported data returns HTTP 422 with a diagnostic. Existing request-size and rate limits apply.
