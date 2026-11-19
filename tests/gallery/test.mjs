import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {compile,toRecords} from '../../dist/ACSVTranspiler.js';
const examples=JSON.parse(readFileSync(new URL('../../content/gallery.json',import.meta.url),'utf8'));
for(const example of examples)test(example.label,()=>{
 const result=compile({input:example.source,mode:'zrow'});
 expect(result.rows).toHaveLength(example.expectedRows);
 expect(toRecords(result)).toHaveLength(example.expectedRows);
});
test('browser matrix covers each combination once',()=>{
 const e=examples.find(x=>x.id==='browser-matrix');
 const rows=toRecords(compile({input:e.source,mode:'zrow'}));
 expect(rows.map(r=>`${r.browser}:${r.layout}`)).toEqual(['chrome:desktop','firefox:desktop','chrome:mobile','firefox:mobile']);
});
