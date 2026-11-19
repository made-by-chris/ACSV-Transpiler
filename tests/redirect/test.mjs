import {test,expect} from 'vitest';
import worker from '../../worker/redirect.ts';
test('permanent redirects preserve paths and queries for GET and POST',async()=>{
 for(const method of ['GET','POST']){
  const response=await worker.fetch(new Request('https://acsv.majaku.com/api/v1/convert?format=json',{method}));
  expect(response.status).toBe(308);
  expect(response.headers.get('Location')).toBe('https://zrow.majaku.com/api/v1/convert?format=json');
 }
});
test('draft bridge is uncached and embeddable only by the new site',async()=>{
 const response=await worker.fetch(new Request('https://acsv.majaku.com/_draft-migration'));
 expect(response.status).toBe(200);
 expect(response.headers.get('Cache-Control')).toBe('no-store');
 expect(response.headers.get('Content-Security-Policy')).toBe('frame-ancestors https://zrow.majaku.com');
});
