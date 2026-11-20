import {test,expect} from 'vitest';
import {toZROW,compile,serializeJSON} from '../../dist/ZROWCompiler.js';
test('CSV preserves literal cells including syntax and multiline values',()=>{
 const input='id,name\n001,"a\nb"\n002,"{id}"';
 const source=toZROW({input,format:'csv'});
 expect(compile({input:source,mode:'zrow'}).rows).toEqual([['001','a\nb'],['002','{id}']]);
});
test('JSON preserves types and named tables',()=>{
 const data={people:[{id:1,name:'Ada',active:true}]};
 const source=toZROW({input:JSON.stringify(data),format:'json'});
 expect(JSON.parse(serializeJSON(compile({input:source,mode:'zrow'})))).toEqual(data);
});
test('unsupported data fails explicitly',()=>{
 for(const input of ['[]','[{"a":null}]','[{"a":1},{"a":"1"}]','[{"a":{}}]']) expect(()=>toZROW({input,format:'json'})).toThrow();
 expect(()=>toZROW({input:'a,b\n1',format:'csv'})).toThrow();
});
