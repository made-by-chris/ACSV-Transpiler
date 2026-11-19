import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L3.11-groups: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"id,group\n> scope group",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_CONTROL'}]});
});
