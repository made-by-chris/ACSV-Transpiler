# ACSV Examples

This file shows short, focused examples for proposed ACSV features. Each block is intentionally small to illustrate intent, followed by expected CSV output.

## Basics: headers, assign, increment
```acsv
id,name

id++,name=John Doe
,,,
,,,
```

```csv
id,name
1,John Doe
2,John Doe
3,John Doe
```

## Variables: assign once, reuse
```acsv
id,project,version

id++,project=ACME,version=1.2.3
,,,
```

```csv
id,project,version
1,ACME,1.2.3
2,ACME,1.2.3
3,ACME,1.2.3
```

## Row repeat counts
```acsv
id,name

id++,name=John x3
```

```csv
id,name
1,John
2,John
3,John
```

## Ranges / series
```acsv
id

id=1..5
```

```csv
id
1
2
3
4
5
```

## Step and units for accumulators
Assume `date++1d` is implied per data row when a date is present.
```acsv
id,date

id++2,date=2025-01-01
,,
,,
,,
```

```csv
id,date
2,2025-01-01
4,2025-01-02
6,2025-01-03
8,2025-01-04
```

## Column references and expressions
```acsv
price,qty,total

price=10,qty=3,total=price*qty
,,,
```

```csv
price,qty,total
10,3,30
10,3,30
10,3,30
```

## prev()/row()/col() helpers
```acsv
value,diff

value=10
,,
value=15,diff=value - prev(value)
```

```csv
value,diff
10,
10,
15,5
```

## Conditional assignment (if/else)
```acsv
spend,tier

spend=900,tier=if(spend>1000,"GOLD","SILVER")
spend=1200,tier=if(spend>1000,"GOLD","SILVER")
```

```csv
spend,tier
900,SILVER
1200,GOLD
```

## Templates / interpolation
```acsv
first,last,email

first=Jane,last=Doe,email="{first}.{last}@example.com".lower()
```

```csv
first,last,email
Jane,Doe,jane.doe@example.com
```

## Formatting helpers
```acsv
id,sku

id=42,sku="SKU-" + pad(id,5)
```

```csv
id,sku
42,SKU-00042
```

## Dates/times: arithmetic and formatting
```acsv
order_at,ship_at

order_at=2025-01-01,ship_at=formatDate(order_at + 3d, "YYYY-MM-DD")
```

```csv
order_at,ship_at
2025-01-01,2025-01-04
```

## Deterministic random (seeded)
```acsv
id,rand

id++,rand=randInt(1,10, seed=123)
,,,
,,,
```

Example expected (illustrative; must be defined by implementation):
```csv
id,rand
1,3
2,9
3,7
```

## Distributions (weighted choice)
```acsv
status

status=choiceWeighted(["PAID":0.8,"DUE":0.2], seed=42)
```

Example expected with the given seed:
```csv
status
PAID
```

## Faker-like generators (deterministic)
```acsv
first,last,phone

first=faker.firstName(seed=7),last=faker.lastName(seed=7),phone=faker.phone(seed=7)
```

Example expected with the given seed:
```csv
first,last,phone
Alice,Johnson,555-0107
```

## Null/blank control
```acsv
email

email=maybe(null, p=0.1)
```

Example output (null may occur ~10%):
```csv
email

```

## Groups / scoped state
```acsv
id,group

id++
,,

# begin scoped controls
id++2,group=A
,,,
# STOP scope
id++STOP

# normal increment resumes
,,
```

```csv
id,group
1,
3,A
5,A
7,A
7,
8,
```

## STOP with scope
```acsv
id

id++
,,,

id++STOP
,,
```

```csv
id
1
2
3
3
4
```

## Includes / composition
```acsv
# main.acsv
id,name

include "./common.acsv"
```

```acsv
# common.acsv
id++,name=Shared
,,,
```

```csv
id,name
1,Shared
2,Shared
3,Shared
```

## CSV dialect controls in-file
```acsv
#dialect delimiter=";" quote='"' newline="\r\n"
id;name

id++;name=Jane
,,
```

```csv
id;name
1;Jane
2;Jane
```

## Safety mode for Excel injection
```acsv
#safety excel=true
formula

formula==SUM(A1:A2)
```

```csv
formula
'=SUM(A1:A2)
```

---

# Library API sketches (proposals)

## Transpile (existing)
```js
import transpile from 'acsv-transpiler';
const csv = transpile({ input, streaming: false, stats: false });
```

## Streamed generation (proposal)
```js
import { transpileStream } from 'acsv-transpiler';
for await (const row of transpileStream({ input })) {
  process.stdout.write(row + '\n');
}
```

## Validation (proposal)
```js
import { validate, isValid } from 'acsv-transpiler';

const report = validate({ input, strict: true });
if (!report.ok) {
  for (const err of report.errors) {
    console.error(`${err.code} at row ${err.row}, col ${err.col}: ${err.message}`);
  }
}

if (!isValid({ input })) {
  console.error('Invalid ACSV');
}
```

Validation report shape (proposal):
```ts
interface ValidationError {
  code: string;        // e.g. "E_UNKNOWN_COLUMN"
  row: number;         // 1-based input line
  col?: number;        // optional cell index
  message: string;     // human-readable
}
interface ValidationReport {
  ok: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  stats?: Record<string, number>;
}
```

# CLI sketches (proposals)

## Transpile
```bash
npx acsv transpile --in input.acsv --out output.csv --strict --excel-safe --delimiter ';'
```

## Validate
```bash
npx acsv validate --in input.acsv --strict
# exit code 0 on ok, 1 on errors; prints a report
```

## Preview (first N rows)
```bash
npx acsv preview --in input.acsv --rows 50
```

