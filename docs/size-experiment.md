# Recipe size measurements — 2026-11-19

These measurements compare ZROW 0.3 source with its verified generated output. Counts use tiktoken 0.14.0 and o200k_base. The raw report also includes cl100k_base, characters and UTF-8 bytes. JSON is compact.

| Example | Recipe tokens | Expanded CSV | Compact JSON |
| --- | ---: | ---: | ---: |
| 3 regular app rows | 30 | 20 | 39 |
| 25 regular app rows | 30 | 130 | 303 |
| 250 regular app rows | 30 | 1255 | 3003 |
| 100 game levels | 53 | 698 | 1295 |
| 5 irregular literal records | 37 | 37 | 60 |

The complete current authoring guide costs 690 tokens in o200k_base. Include that overhead when comparing a workflow that needs to supply the guide. Counts exclude task prompts, Markdown fences, reasoning, retries and execution. These hand-authored cases measure representation size; they do not measure model accuracy or human reading speed. Small and irregular datasets can be larger as recipes.

Reproduce:

```sh
npm run build:lib
python -m pip install tiktoken==0.14.0
python scripts/benchmark-recipes.py > results.json
```

[Raw results](benchmarks/2026-11-19-readable-recipes.json) · [Benchmark script](../scripts/benchmark-recipes.py) · [Authoring guide](authoring.md)
