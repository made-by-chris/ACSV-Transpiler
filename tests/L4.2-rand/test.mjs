import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L4.2-rand', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
