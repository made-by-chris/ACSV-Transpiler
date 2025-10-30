import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L2.2-one-shot-inc-dec', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
