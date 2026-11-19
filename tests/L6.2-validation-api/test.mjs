import { expect, test } from 'vitest';
import { isValid, validate } from '../../dist/ACSVTranspiler.js';

test('validation reports errors without partial output or callbacks', () => {
  expect(isValid({input:'id,name\n> name=Jane\n1,',mode:'acsv'})).toBe(true);
  const calls=[];
  const result=validate({input:'id,name\n> typo++',mode:'acsv',streaming:true,streaming_callback:r=>calls.push(r)});
  expect(result).toMatchObject({valid:false,diagnostics:[{code:'E_COLUMN',line:2}]});
  expect(calls).toEqual([]);
});
