import { describe, expect, test } from 'vitest';
import { addDays, daysBetween, prettyDate, todayKey } from './dates';

describe('addDays', () => {
  test('crosses the end of a month', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  test('crosses the end of a year going backwards', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('daysBetween', () => {
  test('counts whole days across a clock change', () => {
    // European clocks go forward on 29 March 2026, so this span is 47 real hours.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  test('counts whole days across a clock change in the other direction', () => {
    // European clocks go back on 25 October 2026, making this span 49 real hours.
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  test('is negative when the second date is earlier', () => {
    expect(daysBetween('2026-09-10', '2026-09-01')).toBe(-9);
  });
});

describe('prettyDate', () => {
  test('names today', () => {
    expect(prettyDate(todayKey())).toBe('Today');
  });

  test('names yesterday', () => {
    expect(prettyDate(addDays(todayKey(), -1))).toBe('Yesterday');
  });
});
