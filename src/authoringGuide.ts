export const authoringGuide = `Generate a ZROW document for a table or related named tables. Return raw ZROW without Markdown fences.

Start with # ZROW 0.4. Use parenthesized syntax. Declare named enums before (cols ...). A header lists comma-separated names, optionally annotated with :text, :int, :number, :bool, :date or a declared enum. Untyped columns remain strings. Do not invent null values or infer types.

(column=expression,other=expression) sets persistent defaults/formulas and emits no rows.
(row column=value) emits one row with named overrides; omitted fields use defaults.
(rows N) emits N rows; (rows N with column=value) temporarily overrides defaults for that block.
(expect N) checks the final output row count; (unique id) checks a key, (unique a,b) checks a composite key.
Literal CSV rows can appear between forms and must match the header width. Quoted empty fields explicitly produce empty text. Unquoted empty fields use defaults.

seq() counts from 1; seq(start,step) also supports quoted ISO dates with whole UTC-day steps. cycle("A","B") repeats a list. Generators advance with every emitted row, including overrides. Reassignment restarts their index.

(enum Role "member","admin") defines a named text enum. Use role:Role as the column type and cycle(Role) or choice(Role) as a generator. All emitted values are checked against the enum.

Random generators require a main-document seed before emitting rows: (seed 42) or (seed "sample"). Use rand() or rand(min,max), randInt(min,max) with inclusive integer endpoints, normal() or normal(mean,sd), choice("A","B"), choiceWeighted("A",9,"B",1). Latitude/longitude accept zero or two bounds. Coordinates are synthetic. Lists contain at most 32 values. Weights must be nonnegative with a positive finite sum.

Clock helpers today(), tomorrow(), yesterday() return UTC dates; now() returns an ISO UTC timestamp. All rows share one captured instant. Use (time "2026-11-19T12:00:00Z") to fix it, or the host clock is used. Fix time as well as seed for complete reproducibility. Library/API seed and referenceTime options can replace document declarations; do not supply both.

Expressions support current-row column references, arithmetic, comparisons, if(condition,yes,no), prev(column), pad(value,width), round(value,digits), min/max, clamp, pow, date+3d and formatDate(date,"YYYY-MM-DD"). Strings interpolate values: "user{id}@example.test". Use .lower()/.upper() for text case. Quote punctuation and literal words matching column/enum names.


Version 0.4: (param count:int=10) declares a typed input with a default. Library/API params or CLI --params override declared parameters. Parameters can appear in expressions, templates, (rows count) and (expect count). Declare parameters and functions before tables.
(fn sale(price,percent)=round(price*(1-percent/100),2)) declares a pure expression function. Call sale(100,15). Functions use explicit arguments, earlier parameters and earlier functions. No recursion, row access, random generators, seq, cycle, prev or clock helpers inside functions; pass those values as arguments.
(table customers followed by a newline starts a named table; a standalone ) closes it. Use (cols ...) and normal row rules inside. Multiple table blocks emit separate tables. (ref customer_id=customers.id) validates every local key against a unique, same-typed column in an earlier table. choice(customers.id) or cycle(customers.id) selects actual earlier values. Empty lists cannot be sampled. Declarations are global; nested tables and includes within named-table documents are unsupported. CSV requires selecting a table; dataset JSON is an object of table-name arrays. Limits apply across the whole dataset.

Example:
# ZROW 0.4
(enum Role "member","admin")
(cols id:int,name,role:Role)
(expect 3)
(unique id)
(id=seq(),name="User {id}",role=member)
(rows 2)
3,"Shelley, Chris",admin

Forms may be indented inside table blocks; otherwise start in column 1 and occupy one physical line. Full-line # comments and blank lines emit no rows. Add a trailing # comment after a complete form: (rows 6) # generate six rows. Hashes inside quoted strings and literal CSV fields remain data. Limits: 10,000 rows, 250,000 cells. No arbitrary JavaScript evaluation, Faker, nested tables or browser file/network access. Use literal records for irregular cases. Validate with the ZROW compiler before claiming that a recipe is executable.`;
