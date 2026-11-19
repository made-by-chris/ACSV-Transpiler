import { test, expect } from 'vitest';
import { validate } from '../../dist/ACSVTranspiler.js';

test('L4.3-choice: reject unsupported syntax instead of producing misleading data', () => {
  expect(validate({input:"status\n> status=choiceWeighted([\"PAID\":0.8,\"DUE\":0.2], seed=42)",mode:'acsv'})).toMatchObject({valid:false, diagnostics:[{code:'E_UNSUPPORTED'}]});
});
