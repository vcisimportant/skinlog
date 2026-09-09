import { daysBetween } from './dates';
import { Entry, FACTORS, LEVELS, Product } from './types';

// A period run keeps going as long as period days appear within this many days of
// each other, so forgetting to log a day mid-period does not restart the count.
const NEW_PERIOD_GAP = 10;

// Past this, the count is almost certainly a period that never got logged rather
// than a real cycle, so it is left blank instead of exported as a misleading number.
const MAX_CYCLE_DAY = 60;

// Cycle day = days since the first day of the most recent period run, counting
// calendar days, so gaps in logging do not merge two separate periods into one.
export function cycleDays(sorted: Entry[]): Record<string, number | ''> {
  const out: Record<string, number | ''> = {};
  let lastStart: string | null = null;
  let lastPeriodDay: string | null = null;
  for (const e of sorted) {
    if (e.period) {
      if (!lastPeriodDay || daysBetween(lastPeriodDay, e.date) >= NEW_PERIOD_GAP) lastStart = e.date;
      lastPeriodDay = e.date;
    }
    const n = lastStart ? daysBetween(lastStart, e.date) + 1 : 0;
    out[e.date] = n > 0 && n <= MAX_CYCLE_DAY ? n : '';
  }
  return out;
}

export function csvCell(v: string | number | boolean | null | ''): string {
  if (v === null || v === '') return '';
  const s = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function buildCsv(entries: Record<string, Entry>, products: Product[]): string {
  const sorted = Object.values(entries).sort((a, b) => (a.date < b.date ? -1 : 1));
  const cycle = cycleDays(sorted);
  // Include archived products too so old days keep their columns.
  const used = new Set(sorted.flatMap((e) => e.products));
  const cols = products.filter((p) => !p.archived || used.has(p.id));
  const header = [
    'date',
    'redness',
    'oiliness',
    'spots',
    'period',
    'cycle_day',
    'sleep_hours',
    ...LEVELS.map((l) => slug(l.label)),
    ...FACTORS.map(slug),
    ...cols.map((p) => `product_${slug(p.name)}`),
    'notes',
  ];
  const rows = sorted.map((e) => [
    e.date,
    e.redness,
    e.oiliness,
    e.spots,
    e.period,
    cycle[e.date],
    e.sleepHours,
    ...LEVELS.map((l) => e.levels[l.key]),
    ...FACTORS.map((f) => e.factors.includes(f)),
    ...cols.map((p) => e.products.includes(p.id)),
    e.notes,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
