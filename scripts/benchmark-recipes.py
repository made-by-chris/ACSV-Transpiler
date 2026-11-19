"""Reproducible size experiment. Requires: npm run build:lib; pip install tiktoken==0.14.0.
Run: python scripts/benchmark-recipes.py > results.json
Counts author-written recipes and their verified expansions, not model accuracy.
"""
import csv, io, json, subprocess
from pathlib import Path
import tiktoken
ROOT=Path(__file__).resolve().parent.parent
JS='''import fs from 'node:fs';
import {compile,serializeJSON} from './dist/ZROWCompiler.js';
const result=compile({input:fs.readFileSync(0,'utf8'),mode:'zrow'});
console.log(JSON.stringify({csv:result.csv,json:serializeJSON(result,false)}));'''
encoders={name:tiktoken.get_encoding(name) for name in ['o200k_base','cl100k_base']}
guide=(ROOT/'src/authoringGuide.ts').read_text().split('`')[1]
def expand(source):
    return json.loads(subprocess.check_output(['node','--input-type=module','-e',JS],input=source,text=True,cwd=ROOT))
def counts(value):
    return {'characters':len(value),'utf8_bytes':len(value.encode()),'tokens':{name:len(enc.encode(value)) for name,enc in encoders.items()}}
results=[]
for n in [3,25,250]:
    source=f'# ZROW 0.3\n(cols id,role,active)\n(id=seq(),role=member,active=true)\n(rows {n})'
    output=expand(source)
    assert len(list(csv.reader(io.StringIO(output['csv']))))==n+1
    results.append({'case':f'{n} regular app rows','rows':n,'formats':{k:counts(v) for k,v in {'recipe':source,**output}.items()},'source':source})
source='# ZROW 0.3\n(cols level:int,hp:int,damage:int)\n(level=seq(),hp=round(80*pow(1.12,level-1)),damage=min(99,5+level*3))\n(rows 100)'
output=expand(source)
assert len(json.loads(output['json']))==100
results.append({'case':'100 game levels','rows':100,'formats':{k:counts(v) for k,v in {'recipe':source,**output}.items()},'source':source})
source='key,value\nj7Q,cobalt\nm2R,17.38\nz8T,plum\nb3K,-8.04\nv9P,linen'
output=expand(source)
assert output['csv']==source
results.append({'case':'5 irregular literal records','rows':5,'formats':{k:counts(v) for k,v in {'recipe':source,**output}.items()},'source':source})
print(json.dumps({'method':'Hand-authored examples expanded by the compiler; CSV row counts checked. Recipes use ZROW 0.3 parenthesized notation. JSON is compact, not pretty-printed. Counts exclude task prompts, Markdown fences, reasoning, retries and execution. The complete copyable LLM guide is counted separately, not hidden in recipe savings. No LLM accuracy or human usability experiment was performed. Small or irregular datasets may not benefit.','tokenizer_version':tiktoken.__version__,'llm_guide_overhead':counts(guide),'cases':results},indent=2))
