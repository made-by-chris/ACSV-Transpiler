export const authoringGuide = `Generate ZROW for a flat table. Return raw ZROW only, without Markdown fences.

Start with # ZROW 0.3 on its own line, then one comma-separated header. Optional column types: :text, :int, :number, :bool, :date. Untyped columns stay strings; bool accepts true/false; date is YYYY-MM-DD. Do not invent nulls or infer types from values.

Parenthesized notation is supported in version 0.2: (cols id:int,name) declares columns; (id=seq(),name="User {id}") sets defaults without emitting a row; (rows 10) emits ten rows; (row name=Chris) emits one row with named overrides. (expect N) and (unique id) assert constraints. Existing @ directives can be mixed with these forms.

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

Version 0.3: (enum Role "member","admin") before the header defines allowed text values; use role:Role as the column type. cycle(Role) repeats the list and choice(Role) randomly selects a member. Enum values are validated for ordinary CSV rows and named overrides too.

Random functions require (seed 42) or (seed "sample") in the main document before emitting rows. Use rand() or rand(min,max), randInt(min,max) including both integer endpoints, normal() or normal(mean,sd), choice("A","B"), choiceWeighted("A",9,"B",1). Latitude/longitude generators accept zero or two bounds: latitude(-90,90), longitude(-180,180). Coordinates are synthetic. Lists have at most 32 entries; weights are nonnegative with positive finite sum.

Clock helpers today(), tomorrow(), yesterday() return UTC dates; now() returns an ISO UTC timestamp. One captured instant is shared by all rows. Use (time "2026-11-19T12:00:00Z") before emitting rows to fix it; otherwise the host clock is used. A seed alone does not fix time. Library/API options seed and referenceTime can replace declarations; do not supply both forms.

Example:
# ZROW 0.3
id:int,name,active:bool
@expect 3
@unique id
@set id=seq(),active=true
@rows 2 with name=cycle("Ada","Bo")
@row name=Cy,active=false

Ordinary CSV data rows may be mixed in; they must match header width. # starts a full-line comment. Directives start at the beginning of a line. Literal CSV mode interprets none of this syntax.

Keep recipes deterministic and readable. Maximum 10,000 rows / 250,000 cells. No JavaScript, Faker, nested tables or network/file access in the browser. Use explicit literal cases for irregular real data rather than inventing a pattern. Validate with the ZROW compiler before claiming a recipe is executable.`;
