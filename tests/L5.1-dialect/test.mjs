import { test, expect } from 'vitest';
import { validate } from '../../dist/ACSVTranspiler.js';

test('L5.1-dialect: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"#dialect delimiter=\";\"\nid;name",mode:'acsv'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
