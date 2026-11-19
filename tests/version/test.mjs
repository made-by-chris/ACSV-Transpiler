import {test,expect} from 'vitest';
import {compile} from '../../dist/ACSVTranspiler.js';
test('optional XCSV declaration preserves output and source line numbers',()=>{
 const input='id:int\n@set id=seq()\n@rows 2';
 const a=compile({input,mode:'acsv'}), b=compile({input:'# XCSV 0.1\n'+input,mode:'xcsv'});
 expect(b.csv).toBe(a.csv);expect(b.origins[0][0].line).toBe(a.origins[0][0].line+1);
});
test.each(['# XCSV 9.0\nid','# XCSV banana\nid','id\n# XCSV 0.1','# XCSV 0.1\n# XCSV 0.1\nid'])('rejects incompatible or misplaced declarations: %s',input=>{
 expect(()=>compile({input,mode:'xcsv'})).toThrow();
});
test('literal CSV remains unchanged',()=>{
 const input='# XCSV 9.0\nid';expect(compile({input,mode:'csv'}).csv).toBe(input);
});
