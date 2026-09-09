import { cycleDays } from './cycle';
import { Entry, Factor, LEVELS, Product } from './types';

export function csvCell(v: string | number | boolean | null | ''): string {
  if (v === null || v === '') return '';
  const s = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Retired products and factors keep their column as long as some logged day still
// references them, so older rows stay complete.
const columnsFor = <T extends Product | Factor>(all: T[], used: Set<string>) =>
  all.filter((x) => !x.archived || used.has(x.id));

export function buildCsv(
  entries: Record<string, Entry>,
  products: Product[],
  factors: Factor[],
): string {
  const sorted = Object.values(entries).sort((a, b) => (a.date < b.date ? -1 : 1));
  const cycle = cycleDays(sorted);
  const productCols = columnsFor(products, new Set(sorted.flatMap((e) => e.products)));
  const factorCols = columnsFor(factors, new Set(sorted.flatMap((e) => e.factors)));

  const header = [
    'date',
    'redness',
    'oiliness',
    'spots',
    'period',
    'cycle_day',
    'sleep_hours',
    ...LEVELS.map((l) => slug(l.label)),
    ...factorCols.map((f) => slug(f.name)),
    ...productCols.map((p) => `product_${slug(p.name)}`),
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
    ...factorCols.map((f) => e.factors.includes(f.id)),
    ...productCols.map((p) => e.products.includes(p.id)),
    e.notes,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
