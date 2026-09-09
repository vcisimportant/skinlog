import { describe, expect, test } from 'vitest';
import { cycleDays } from './cycle';
import { Entry, emptyEntry } from './types';

const day = (date: string, patch: Partial<Entry> = {}): Entry => ({ ...emptyEntry(date), ...patch });

describe('cycleDays', () => {
  test('a period logged four weeks after the last one starts a new cycle', () => {
    // Period on 1 Sep, nothing logged in between, period again on 29 Sep.
    const cycle = cycleDays([day('2026-09-01', { period: true }), day('2026-09-29', { period: true })]);
    expect(cycle['2026-09-29']).toBe(1);
  });

  test('cycle day is blank once it runs past any plausible cycle length', () => {
    const cycle = cycleDays([day('2026-01-01', { period: true }), day('2026-06-01')]);
    expect(cycle['2026-06-01']).toBe('');
  });

  test('a day missed in the middle of a period does not restart the count', () => {
    const cycle = cycleDays([
      day('2026-09-01', { period: true }),
      day('2026-09-02', { period: true }),
      // 3 Sep never logged
      day('2026-09-04', { period: true }),
    ]);
    expect(cycle['2026-09-04']).toBe(4);
  });

  test('days counted from the first day of the period, not from each period day', () => {
    const cycle = cycleDays([
      day('2026-09-01', { period: true }),
      day('2026-09-02', { period: true }),
      day('2026-09-03'),
    ]);
    expect([cycle['2026-09-01'], cycle['2026-09-02'], cycle['2026-09-03']]).toEqual([1, 2, 3]);
  });

  test('days before the first logged period have no cycle day', () => {
    const cycle = cycleDays([day('2026-09-01'), day('2026-09-02', { period: true })]);
    expect(cycle['2026-09-01']).toBe('');
  });
});
