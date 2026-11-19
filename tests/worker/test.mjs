import {describe,it,expect} from 'vitest';
import worker from '../../worker/index.ts';
const env={LIMITER:{limit:async()=>({success:true})},ASSETS:{fetch:async()=>new Response('asset')}};
const req=(body,headers={})=>new Request('https://zrow.majaku.com/api/v1/convert',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
describe('conversion worker',()=>{
 it('produces typed JSON through the real compiler',async()=>{const r=await worker.fetch(req({input:'id:int,active:bool\n@set id=seq(),active=true\n@rows 2',format:'json'}),env);expect(r.status).toBe(200);expect((await r.json()).data).toEqual([{id:1,active:true},{id:2,active:true}]);});
 it('preserves literal CSV',async()=>{const input='"id",value\r\n001,"a,b"\r\n';const r=await worker.fetch(req({input,mode:'csv'}),env);expect((await r.json()).data).toBe(input);});
 it('rejects invalid JSON and bad types',async()=>{expect((await worker.fetch(req('{'),env)).status).toBe(400);expect((await worker.fetch(req({input:42}),env)).status).toBe(400);});
 it('bounds streamed bodies without trusting Content-Length',async()=>{expect((await worker.fetch(req('x'.repeat(65537)),env)).status).toBe(413);});
 it('returns diagnostics without evaluating JavaScript',async()=>{const r=await worker.fetch(req({input:'id\n@set id=process.exit()\n@rows 1'}),env);expect(r.status).toBe(422);expect((await r.json()).error.code).toBeTruthy();});
 it('enforces rate limits and methods',async()=>{expect((await worker.fetch(req({input:'id\n1'}),{...env,LIMITER:{limit:async()=>({success:false})}})).status).toBe(429);expect((await worker.fetch(new Request('https://zrow.majaku.com/api/v1/convert'),env)).status).toBe(405);});
});
