# ZROW authoring guide

Syntax and constraints for writing ZROW recipes. Validate recipes before exporting.

```text
Generate ZROW for a flat table. Return raw ZROW only, without Markdown fences.

Start with # ZROW 0.1 on its own line, then one comma-separated header. Optional column types: :text, :int, :number, :bool, :date. Untyped columns stay strings; bool accepts true/false; date is YYYY-MM-DD. Do not invent nulls or infer types from values.

After the header:
@expect N checks the total output row count. Declare it near the top.
@unique id checks one key; @unique a,b checks a composite key.
@set column=expression,other=expression sets persistent defaults/formulas.
@rows N generates N rows from the current defaults. No empty comma rows are needed.
@row column=value,other=value generates one row with named overrides.
@rows N with column=value repeats a temporary override. Overrides do not change defaults.

seq() counts from 1. seq(start,step) supports numeric or quoted ISO-date starts (date steps are whole UTC days).
cycle("A","B") repeats values. Both start at their rule's declaration and advance once per emitted row, including overrides. Reassigning restarts them.

Formulas use current-row column names, + - * / %, comparisons, parentheses, if(condition,yes,no), prev(column), pad(value,width), round(value,digits), min/max, clamp(value,min,max), pow(base,exponent), and formatDate(date+3d,"YYYY-MM-DD"). Strings can interpolate "user{id}@example.test" and use .lower()/.upper(). Quote text with punctuation or matching a column name. Use column="" for an explicit empty string.

Example:
# ZROW 0.1
id:int,name,active:bool
@expect 3
@unique id
@set id=seq(),active=true
@rows 2 with name=cycle("Ada","Bo")
@row name=Cy,active=false

Ordinary CSV data rows may be mixed in; they must match header width. # starts a full-line comment. Directives start at the beginning of a line. Literal CSV mode interprets none of this syntax.

Keep recipes deterministic and readable. Maximum 10,000 rows / 250,000 cells. No JavaScript, randomness, Faker, nested tables or network/file access in the browser. Use explicit literal cases for irregular real data rather than inventing a pattern. Validate with the ZROW compiler before claiming a recipe is executable.
```

For very small or irregular tables, plain CSV can be shorter and easier. Use recipes for repeated structure and explicit literals for irregular facts. Do not infer that fewer output tokens imply better accuracy.

## Version marker

Put `# ZROW 0.1` on the first line of new recipes, before the column header. This optional declaration is excluded from CSV and JSON output. Missing declarations use the current language. Unsupported, malformed, repeated or misplaced declarations fail with E_VERSION. The language version is separate from the implementation package version. Use mode zrow; acsv and xcsv are compatibility aliases. Agent entry point: https://zrow.majaku.com/llms.txt .
