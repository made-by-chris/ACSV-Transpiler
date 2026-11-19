import { test, expect } from 'vitest';
import { validate } from '../../dist/ACSVTranspiler.js';

test('L4.2-rand: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"id,rand\n> id++,rand=randFloat(0,1, seed=5, precision=2)",mode:'acsv'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
