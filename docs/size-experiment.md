# Recipe size experiment — 2026-11-19

These measurements compare recipe text with its generated output. Counts use `tiktoken 0.14.0` with `o200k_base`; the raw report also includes `cl100k_base`, characters and UTF-8 bytes. JSON is compact, not pretty-printed.

| Example | Recipe tokens | Expanded CSV | Compact JSON | Legacy recipe |
| --- | ---: | ---: | ---: | ---: |
| 3 regular app rows | 23 | 20 | 39 | 17 |
| 25 regular app rows | 23 | 130 | 303 | 17 |
| 250 regular app rows | 23 | 1255 | 3003 | 17 |
| 100 game levels | 46 | 698 | 1295 | — |
| 5 irregular literal records | 37 | 37 | 60 | — |

The original authoring guide snapshot costs **489 tokens** in `o200k_base` (487 in `cl100k_base`). Adding it once to the 250-row recipe gives **512 tokens versus 1,255 for CSV**, about **59% fewer**. For 25 rows, the full guide plus recipe is larger than the CSV. This overhead matters unless the model already knows the language or the guide is reused.

The new named syntax uses six more tokens than the legacy repeat recipe in these three regular app cases. Its benefits are explicit commands, named exceptions and simpler edits. Most compression comes from expressing a pattern instead of expanding it, not from shortening punctuation. Irregular literal data has no recipe savings.

Excluded: shared task prompts, Markdown fences, model reasoning, retries, execution time/cost and any expanded result subsequently returned to the user. Typed/untyped representations are compared as emitted; JSON objects carry repeated keys. These cases do not measure authoring accuracy or reading speed.

Reproduce:

```sh
npm run build:lib
python -m pip install tiktoken==0.14.0
python scripts/benchmark-recipes.py > results.json
```

[Raw results](benchmarks/2026-11-19-readable-recipes.json) · [Benchmark script](../scripts/benchmark-recipes.py) · [Authoring guide](authoring.md)

Related references: [TOON’s format overview](https://toonformat.dev/guide/format-overview) informed explicit structural declarations; [JSON Schema’s type reference](https://json-schema.org/understanding-json-schema/reference/type) informed explicit primitive typing; [Faker’s reproducibility notes](https://fakerjs.dev/guide/usage.html) reinforced keeping this profile independent of changing catalogs and relative dates. These are design inputs, not comparative performance evidence.
