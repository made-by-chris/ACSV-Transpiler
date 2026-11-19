import { test, expect } from 'vitest';
import { validate } from '../../dist/ACSVTranspiler.js';

test('L3.10-null: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"email\n> email=maybe(null, p=0.1)",mode:'acsv'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
