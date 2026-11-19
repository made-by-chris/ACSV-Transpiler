import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('unknown controls and ragged rows have actionable source locations', () => {
  expect(validate({input:'id,name\n> unknown++',mode:'zrow'})).toMatchObject({valid:false,diagnostics:[{code:'E_COLUMN',line:2,message:expect.stringContaining('unknown')}]});
  expect(validate({input:'id,name\n1,Jane,extra',mode:'zrow'})).toMatchObject({valid:false,diagnostics:[{code:'E_WIDTH',line:2,message:'Expected 2 fields, received 3.'}]});
});
