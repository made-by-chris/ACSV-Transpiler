import { test, expect } from 'vitest';
import { getActualExpected } from '../_helpers.mjs';

test('L6.1-streamed-api', () => {
  const { actual, expected } = getActualExpected(import.meta.url.replace(/test.mjs$/, ''));
  expect(actual).toBe(expected);
});
