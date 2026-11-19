import { test, expect } from 'vitest';
import { validate } from '../../dist/ACSVTranspiler.js';

test('L5.2-excel-safety: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"#safety excel=true\nformula",mode:'acsv'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
