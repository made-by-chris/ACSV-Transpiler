import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L5.1-dialect: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"#dialect delimiter=\";\"\nid;name",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
