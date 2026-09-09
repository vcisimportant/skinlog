import { describe, expect, test } from 'vitest';
import { buildCsv, csvCell, cycleDays } from './csv';
import { Entry, FACTORS, LEVELS, Product, emptyEntry } from './types';

const day = (date: string, patch: Partial<Entry> = {}): Entry => ({ ...emptyEntry(date), ...patch });
const product = (id: string, name: string, archived = false): Product => ({
  id,
  name,
  archived,
  createdAt: '2026-01-01T00:00:00.000Z',
});
const header = (csv: string) => csv.split('\n')[0].split(',');
const rows = (csv: string) => csv.split('\n').slice(1);

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

describe('csvCell', () => {
  test('keeps a zero rather than treating it as missing', () => {
    expect(csvCell(0)).toBe('0');
  });

  test('writes a skipped value as an empty cell', () => {
    expect(csvCell(null)).toBe('');
  });

  test('writes booleans as 1 and 0', () => {
    expect([csvCell(true), csvCell(false)]).toEqual(['1', '0']);
  });

  test('quotes a note containing a comma', () => {
    expect(csvCell('tight, flaky')).toBe('"tight, flaky"');
  });

  test('doubles the quotes inside a quoted note', () => {
    expect(csvCell('the "good" cream')).toBe('"the ""good"" cream"');
  });

  test('quotes a note containing a line break', () => {
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"');
  });
});

describe('buildCsv', () => {
  test('has one column per tracked factor and level, between the fixed columns and notes', () => {
    const cols = header(buildCsv({}, []));
    expect(cols.slice(0, 7)).toEqual([
      'date',
      'redness',
      'oiliness',
      'spots',
      'period',
      'cycle_day',
      'sleep_hours',
    ]);
    expect(cols.at(-1)).toBe('notes');
    expect(cols).toHaveLength(7 + LEVELS.length + FACTORS.length + 1);
  });

  test('a removed product still used on a logged day keeps its column', () => {
    const p = product('p1', 'Old Serum', true);
    const csv = buildCsv({ '2026-09-01': day('2026-09-01', { products: ['p1'] }) }, [p]);
    expect(header(csv)).toContain('product_old_serum');
    expect(rows(csv)[0].endsWith('1,')).toBe(true);
  });

  test('a removed product never used on any day is dropped', () => {
    const csv = buildCsv({ '2026-09-01': day('2026-09-01') }, [product('p1', 'Old Serum', true)]);
    expect(header(csv)).not.toContain('product_old_serum');
  });

  test('rows come out oldest first whatever order the days were logged in', () => {
    const csv = buildCsv(
      { '2026-09-03': day('2026-09-03'), '2026-09-01': day('2026-09-01'), '2026-09-02': day('2026-09-02') },
      [],
    );
    expect(rows(csv).map((r) => r.split(',')[0])).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });

  test('a skipped skin score is an empty cell, a score of 1 is not', () => {
    const csv = buildCsv({ '2026-09-01': day('2026-09-01', { redness: 1, oiliness: null }) }, []);
    const [, redness, oiliness] = rows(csv)[0].split(',');
    expect([redness, oiliness]).toEqual(['1', '']);
  });
});
