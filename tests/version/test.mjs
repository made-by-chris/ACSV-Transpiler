import {test,expect} from 'vitest';
import {compile} from '../../dist/ZROWCompiler.js';
test('optional ZROW declaration preserves output and source line numbers',()=>{
 const input='id:int\n@set id=seq()\n@rows 2';
 const a=compile({input,mode:'zrow'}), b=compile({input:'# ZROW 0.1\n'+input,mode:'zrow'});
 expect(b.csv).toBe(a.csv);expect(b.origins[0][0].line).toBe(a.origins[0][0].line+1);
});
test.each(['# ZROW 9.0\nid','# ZROW banana\nid','id\n# ZROW 0.1','# ZROW 0.1\n# ZROW 0.1\nid'])('rejects incompatible or misplaced declarations: %s',input=>{
 expect(()=>compile({input,mode:'zrow'})).toThrow();
});
test('literal CSV remains unchanged',()=>{
 const input='# ZROW 9.0\nid';expect(compile({input,mode:'csv'}).csv).toBe(input);
});

test("ZROW declaration and mode are supported",()=>{expect(compile({input:"# ZROW 0.1\nid:int\n@set id=seq()\n@rows 2",mode:"zrow"}).rows).toEqual([["1"],["2"]]);});
