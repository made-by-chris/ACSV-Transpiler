import { expect, test } from 'vitest';
import { compile, validate } from '../../dist/ACSVTranspiler.js';
const run=input=>compile({input,mode:'zrow'});
test('parenthesized forms share existing directive semantics and source lines',()=>{
 const result=run('# ZROW 0.2\n(cols id:int,label,active:bool)\n(expect 4)\n(unique id)\n(id=seq(),label=cycle("A","B"),active=true)\n(rows 2)\n(row label="manual, value",active=false)\n(rows 1 with label=end)');
 expect(result.rows).toEqual([['1','A','true'],['2','B','true'],['3','manual, value','false'],['4','end','true']]);
 expect(result.origins[2][1].line).toBe(7);
});
test('implicit assignments emit no rows, while row overrides do not persist',()=>{
 expect(run('(cols id:int,label)\n(id=seq(),label=base)\n(row label=once)\n(rows 1)\n(set label=next)\n(row)').rows).toEqual([['1','once'],['2','base'],['3','next']]);
});
test('ordinary CSV, quoted empty fields and multiline values mix with parenthesized forms',()=>{
 expect(run('(cols id:int,label)\n(id=seq(),label=default)\n(rows 1)\n2,"literal, CSV"\n3,""\n4,"multi\n(rows 99)"\n(row)').rows).toEqual([['1','default'],['2','literal, CSV'],['3',''],['4','multi\n(rows 99)'],['5','default']]);
});
test('literal CSV mode does not interpret parenthesized notation',()=>{
 const input='(cols id),label\n(rows 3),literal';expect(compile({input}).csv).toBe(input);
 expect(run('value\n"(rows 3)"').rows).toEqual([['(rows 3)']]);
 expect(run('value\n(hello)').rows).toEqual([['(hello)']]);
});
test('malformed forms and invalid counts report source diagnostics',()=>{
 expect(validate({input:'(cols id)\n(rows 2',mode:'zrow'}).diagnostics[0]).toMatchObject({code:'E_DIRECTIVE',line:2});
 expect(()=>run('(cols id)\n(id=seq())\n(expect 24)\n(rows 23)')).toThrow('Expected 24 rows');
 expect(()=>run('(cols id)\n(rows 10001)')).toThrow();
 expect(()=>run('(cols id)\n(id=seq(),id=2)')).toThrow();
});

test('explicit version 0.1 keeps parenthesized cells literal',()=>{
 expect(run('# ZROW 0.1\nvalue\n(rows 3)').rows).toEqual([['(rows 3)']]);
 expect(run('# ZROW 0.2\nvalue\n(rows 3)').rows).toHaveLength(3);
});

test('version detection ignores declarations inside quoted CSV and respects a BOM',()=>{
 expect(run('\ufeff# ZROW 0.1\nvalue\n(rows 3)').rows).toEqual([['(rows 3)']]);
 expect(run('# ZROW 0.2\n(cols value)\n"line\n# ZROW 0.1"\n(rows 1)').rows).toHaveLength(2);
});

test('column declarations cannot silently become data, and header errors retain source lines',()=>{
 expect(()=>run('(cols name)\n(cols again)')).toThrow('Declare columns once');
 expect(validate({input:'# ZROW 0.2\n(cols bad"quote)',mode:'zrow'}).diagnostics[0].line).toBe(2);
});
