import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L3.1-row-repeat', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
