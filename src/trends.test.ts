import { describe, expect, test } from 'vitest';
import { cycleAverages, loggedInLast, recentValues } from './trends';
import { Entry, emptyEntry } from './types';

const day = (date: string, patch: Partial<Entry> = {}): Entry => ({ ...emptyEntry(date), ...patch });

describe('recentValues', () => {
  test('gives one slot per day, oldest first, ending on the day asked for', () => {
    const entries = { '2026-09-08': day('2026-09-08', { redness: 4 }) };
    expect(recentValues(entries, 'redness', 3, '2026-09-09')).toEqual([null, 4, null]);
  });

  test('a day logged but skipped on that scale reads as no value', () => {
    const entries = { '2026-09-09': day('2026-09-09', { oiliness: 2 }) };
    expect(recentValues(entries, 'redness', 1, '2026-09-09')).toEqual([null]);
  });
});

describe('cycleAverages', () => {
  const twoCycles = {
    '2026-01-01': day('2026-01-01', { period: true, redness: 1 }),
    '2026-01-02': day('2026-01-02', { redness: 3 }),
    '2026-02-01': day('2026-02-01', { period: true, redness: 3 }),
    '2026-02-02': day('2026-02-02', { redness: 5 }),
  };

  test('averages the same cycle day across separate cycles', () => {
    const avg = cycleAverages(twoCycles, 'redness', 3);
    expect(avg[0]).toEqual({ day: 1, average: 2, samples: 2 });
    expect(avg[1]).toEqual({ day: 2, average: 4, samples: 2 });
  });

  test('a cycle day never logged has no average rather than a zero', () => {
    expect(cycleAverages(twoCycles, 'redness', 3)[2]).toEqual({ day: 3, average: null, samples: 0 });
  });

  test('days logged before any period are left out entirely', () => {
    const entries = { '2026-01-01': day('2026-01-01', { redness: 5 }) };
    expect(cycleAverages(entries, 'redness', 2).every((d) => d.samples === 0)).toBe(true);
  });
});

describe('loggedInLast', () => {
  test('counts only the days inside the window', () => {
    const entries = {
      '2026-09-09': day('2026-09-09'),
      '2026-09-08': day('2026-09-08'),
      '2026-08-01': day('2026-08-01'),
    };
    expect(loggedInLast(entries, 7, '2026-09-09')).toBe(2);
  });
});
