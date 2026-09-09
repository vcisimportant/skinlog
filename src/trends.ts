import { cycleDays } from './cycle';
import { addDays } from './dates';
import { Entry, ScaleKey } from './types';

// One slot per day ending on `today`, oldest first, so the strip reads left to
// right like a calendar. Unlogged days and skipped scales are both null.
export function recentValues(
  entries: Record<string, Entry>,
  key: ScaleKey,
  days: number,
  today: string,
): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const e = entries[addDays(today, -i)];
    out.push(e ? e[key] : null);
  }
  return out;
}

// The same cycle day averaged across every cycle logged, which is where a
// hormonal pattern shows up that a plain date-ordered chart hides.
export function cycleAverages(
  entries: Record<string, Entry>,
  key: ScaleKey,
  maxDay: number,
): { day: number; average: number | null; samples: number }[] {
  const sorted = Object.values(entries).sort((a, b) => (a.date < b.date ? -1 : 1));
  const cycle = cycleDays(sorted);
  const totals = new Array<number>(maxDay).fill(0);
  const counts = new Array<number>(maxDay).fill(0);

  for (const e of sorted) {
    const day = cycle[e.date];
    const value = e[key];
    if (typeof day !== 'number' || day < 1 || day > maxDay || value === null) continue;
    totals[day - 1] += value;
    counts[day - 1] += 1;
  }

  return totals.map((sum, i) => ({
    day: i + 1,
    average: counts[i] ? sum / counts[i] : null,
    samples: counts[i],
  }));
}

export function loggedInLast(entries: Record<string, Entry>, days: number, today: string): number {
  let n = 0;
  for (let i = 0; i < days; i++) if (entries[addDays(today, -i)]) n++;
  return n;
}
