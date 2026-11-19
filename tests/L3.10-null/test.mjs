import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L3.10-null: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"email\n> email=maybe(null, p=0.1)",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
