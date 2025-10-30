import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L5.2-excel-safety', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
