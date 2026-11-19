import {describe,it,expect} from 'vitest';
import {compile,serializeJSON,selectTable} from '../../dist/ZROWCompiler.js';
const run=(input,params)=>compile({input,mode:'zrow',params});
const code=e=>{try{e()}catch(e){return e.code}throw Error('Expected error')};
const dataset=`# ZROW 0.4
(param count:int=3)
(fn label(n)="User {n}")
(seed 42)
(table users
  (cols id:int,name)
  (unique id)
  (id=seq(),name=label(id))
  (rows count)
)
(table orders
  (cols id:int,user_id:int)
  (ref user_id=users.id)
  (id=seq(),user_id=cycle(users.id))
  (rows count*2)
)`;
describe('programs',()=>{
 it('supports defaults, typed overrides and templates',()=>{
 const input=`# ZROW 0.4
(param count:int=2)
(param first_id:int=10)
(param prefix:text="Customer")
(cols id:int,name)
(id=seq(first_id),name="{prefix} {id}")
(rows count)
(expect count)`;
 expect(run(input).rows).toEqual([['10','Customer 10'],['11','Customer 11']]);
 expect(run(input,{count:1,prefix:'A # {literal}'}).rows).toEqual([['10','A # {literal} 10']]);
 expect(code(()=>run(input,{count:'2'}))).toBe('E_PARAM');expect(code(()=>run(input,{cout:2}))).toBe('E_PARAM');
 });
 it('supports reusable pure functions, templates and nested calls',()=>{
 const r=run(`(param discount:number=15)
(fn sale(price,percent)=round(price*(1-percent/100),2))
(fn price(amount)=sale(amount,discount))
(fn label(n)="CUS-"+pad(n,5))
(cols id:int,code,cost:number)
(id=seq(),code=label(id),cost=price(100))
(rows 2)`);expect(r.rows).toEqual([['1','CUS-00001','85'],['2','CUS-00002','85']]);
 });
 it('exports table maps and typed datasets, requiring explicit CSV selection',()=>{
 const r=run(dataset);expect(Object.keys(r.tables)).toEqual(['users','orders']);
 expect(selectTable(r,'orders').rows).toEqual([['1','1'],['2','2'],['3','3'],['4','1'],['5','2'],['6','3']]);
 expect(JSON.parse(serializeJSON(r)).users[0]).toEqual({id:1,name:'User 1'});
 expect(code(()=>r.csv)).toBe('E_TABLE_SELECT');expect(code(()=>selectTable(r,'missing'))).toBe('E_TABLE_SELECT');
 });
 it('samples large table columns without the enum argument limit',()=>{
 const r=run(dataset.replace('cycle(users.id)','choice(users.id)'),{count:50});expect(r.tables.orders.rows).toHaveLength(100);expect(r.tables.orders.rows.every(r=>+r[1]>=1&&+r[1]<=50)).toBe(true);
 });
 it('preserves multiline CSV inside indented blocks',()=>{
 const r=run('(table a\n  (cols id:int,note)\n1,"line one\n(table this is text\n)"\n)');expect(r.tables.a.rows[0][1]).toBe('line one\n(table this is text\n)');
 });
 it('rejects invalid foreign keys after validating literal rows',()=>{
 expect(code(()=>run(dataset.replace('(rows count*2)','1,99')))).toBe('E_RELATION');
 expect(code(()=>run(dataset.replace('(unique id)','').replace('(id=seq(),name=label(id))','(id=1,name=label(id))')))).toBe('E_RELATION');
 expect(code(()=>run(dataset.replace('user_id:int','user_id:text')))).toBe('E_RELATION');
 expect(code(()=>run(dataset.replace("(rows count*2)","(rows 1)"),{count:0}))).toBe('E_RELATION');
 });
 it('rejects recursion, ambient row access and impure functions',()=>{
 for(const source of ['(fn f(n)=f(n))','(fn f(n)=seq())','(fn f(n)=now())','(fn f(n)=rand())','(fn f(n)="{unknown}")','(fn f(n)=n+missing)'])expect(()=>run(source+'\n(cols id)\n(id=1)\n(rows 1)')).toThrow();
 });
 it('rejects invalid declarations and old-version new syntax',()=>{
 for(const source of ['(param n:int=1)\n(param n:int=2)','(fn f(n,n)=n)','(table a\n(table b\n)\n)','(table a\n(cols id)','(cols id)\n(param n:int=1)','(param rows:int=1)'])expect(()=>run(source)).toThrow();
 expect(code(()=>run('# ZROW 0.3\n(param n:int=1)\n(cols id)'))).toBe('E_VERSION');
 });
 it('preserves diagnostics at original lines',()=>{
 try{run('(param n:int=1)\n\n(table users\n  (cols id:int)\n  nope\n)')}catch(e){expect(e.line).toBe(5);return;}throw Error('Expected failure');
 });
 it('enforces dataset-wide output limits and defers callbacks on invalid refs',()=>{
 expect(code(()=>run(dataset,{count:4000}))).toBe('E_LIMIT');
 let called=false;expect(()=>compile({input:dataset.replace('(rows count*2)','1,99'),mode:'zrow',stats:true,stats_callback:()=>called=true})).toThrow();expect(called).toBe(false);
 });
});

it('rejects scope collisions and evaluates parameters as data',()=>{
 expect(()=>run('(param n:int=1)\n(cols n:int)\n(rows 1)')).toThrow();
 expect(()=>run('(param n:int=1)\n(fn f(n)=n)\n(cols id)')).toThrow();
 expect(()=>run('(param n:date="2026-02-30")\n(cols id)')).toThrow();
 expect(run('(param flag:bool=false)\n(cols x:bool)\n(x=flag)\n(rows 1)',{flag:true}).rows).toEqual([['true']]);
});
it('bounds nested pure function evaluation',()=>{
 let input='(fn f0(n)=n)\n';for(let i=1;i<35;i++)input+=`(fn f${i}(n)=f${i-1}(n))\n`;input+='(cols v:int)\n(v=f34(1))\n(rows 1)';expect(code(()=>run(input))).toBe('E_LIMIT');
});
it('shares clock context across tables and allows zero-row datasets',()=>{
 const r=run('(time "2026-11-20T12:00:00Z")\n(table a\n(cols v)\n(v=now())\n(rows 1)\n)\n(table b\n(cols v)\n(v=now())\n(rows 1)\n)');expect(r.tables.a.rows).toEqual(r.tables.b.rows);
 expect(run(dataset,{count:0}).stats.output_rows).toBe(0);
});
