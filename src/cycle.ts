import { daysBetween } from './dates';
import { Entry } from './types';

// A period run keeps going as long as period days appear within this many days of
// each other, so forgetting to log a day mid-period does not restart the count.
const NEW_PERIOD_GAP = 10;

// Past this, the count is almost certainly a period that never got logged rather
// than a real cycle, so it is left blank instead of exported as a misleading number.
const MAX_CYCLE_DAY = 60;

// Cycle day = days since the first day of the most recent period run, counting
// calendar days, so gaps in logging do not merge two separate periods into one.
// Expects entries sorted oldest first.
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
