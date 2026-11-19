import { test, expect } from 'vitest';
import { validate } from '../../dist/ZROWCompiler.js';

test('L4.1-seed: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"id,rand\n> id++,rand=randInt(1,10, seed=123)",mode:'zrow'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
