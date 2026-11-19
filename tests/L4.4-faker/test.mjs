import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L4.4-faker: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"first\n> first=faker.firstName(seed=7)",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
