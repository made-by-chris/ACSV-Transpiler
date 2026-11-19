import {describe,it,expect} from 'vitest';
import {compile,parseCSV} from '../../dist/ZROWCompiler.js';
const run=input=>compile({input,mode:'zrow'});
describe('inline comments',()=>{
 it('annotates columns, assignments and row generation',()=>{
 const r=run('# ZROW 0.3\n(cols id:int,name) # columns\n(id=seq(),name="User {id}") # numbered names\n(rows 2)# generate two');
 expect(r.rows).toEqual([['1','User 1'],['2','User 2']]);
 expect(r.origins[1][0].line).toBe(3);
 });
 it('retains hashes and escaped/doubled quotes in expressions',()=>{
 expect(run('(cols name) # heading\n(name="a \\" # b") # comment\n(rows 1)').rows).toEqual([['a " # b']]);
 expect(run('(cols name)\n(name="a "" # b") # comment\n(rows 1)').rows).toEqual([['a " # b']]);
 expect(run("(cols name)\n(name='a # b') # comment\n(rows 1)").rows).toEqual([['a # b']]);
 });
 it('annotates metadata, overrides and checks with CRLF',()=>{
 const r=run(['# ZROW 0.3','(enum Role "#admin","guest") # roles','(seed 42) # seed','(time "2026-11-19T00:00:00Z") # clock','(cols id:int,role:Role)','(id=seq(),role=choice(Role)) # defaults','(rows 2 with role="#admin") # override','(expect 2) # count','(unique id) # check'].join('\r\n'));
 expect(r.rows).toEqual([['1','#admin'],['2','#admin']]);
 });
 it('preserves hashes in literal CSV, including multiline values',()=>{
 const s='name\nred # value\n"multi\n# value"';expect(run(s).rows).toEqual([['red # value'],['multi\n# value']]);expect(parseCSV(s)).toEqual([['name'],['red # value'],['multi\n# value']]);
 });
 it('does not mask unclosed forms',()=>expect(()=>run('(cols id:int)\n(rows 2 # missing close')).toThrow());
 it('handles legacy instructions and include paths',()=>{
 expect(run('id:int\n@set id=seq() # counter\n@rows 2 # count').rows).toEqual([['1'],['2']]);
 const r=compile({input:'(cols id:int)\ninclude "part # one.zrow" # include',mode:'zrow',resolveInclude:file=>{expect(file).toBe('part # one.zrow');return {input:'(cols id:int)\n1',source:file}}});expect(r.rows).toEqual([['1']]);
 });
});
