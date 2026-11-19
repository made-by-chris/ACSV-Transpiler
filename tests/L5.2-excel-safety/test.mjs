import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L5.2-excel-safety: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"#safety excel=true\nformula",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
