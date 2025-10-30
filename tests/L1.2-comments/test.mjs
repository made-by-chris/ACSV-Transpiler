import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L1.2-comments', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
