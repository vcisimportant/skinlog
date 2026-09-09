// Products and factors are the same shape: a named thing you tick on a day, which
// can be retired without disturbing the days that already reference it.
export type Tracked = {
  id: string;
  name: string;
  archived: boolean;
  createdAt: string;
};

export type Product = Tracked;
export type Factor = Tracked;

export type ScaleKey = 'redness' | 'oiliness' | 'spots';
export type LevelKey = 'alcohol' | 'cigarettes';

export type Entry = {
  date: string; // YYYY-MM-DD
  redness: number | null; // 1-5
  oiliness: number | null; // 1-5
  spots: number | null; // 1-5
  period: boolean;
  sleepHours: number | null;
  levels: Record<LevelKey, 0 | 1 | 2>; // 0 none, 1 some, 2 a lot
  factors: string[]; // factor ids
  products: string[]; // product ids
  notes: string;
  updatedAt: string;
};

// Tap-to-cycle amounts. Edit the labels to suit you.
export const LEVELS: { key: LevelKey; label: string; steps: [string, string] }[] = [
  { key: 'alcohol', label: 'Alcohol', steps: ['1–2 drinks', '3+ drinks'] },
  { key: 'cigarettes', label: 'Cigarettes', steps: ['a few', 'a lot'] },
];

// Only used to fill the factor list the first time the app runs. After that, add
// and remove factors on the Setup tab rather than editing this.
export const DEFAULT_FACTORS = ['Dairy', 'Sugar / white carbs', 'Fried / greasy food', 'Stress', 'Workout'];

export const SCALES: { key: ScaleKey; label: string; low: string; high: string }[] = [
  { key: 'redness', label: 'Redness and irritation', low: 'calm', high: 'angry' },
  { key: 'oiliness', label: 'Oiliness', low: 'matte', high: 'greasy' },
  { key: 'spots', label: 'New spots', low: 'none', high: 'lots' },
];

export function emptyEntry(date: string): Entry {
  return {
    date,
    redness: null,
    oiliness: null,
    spots: null,
    period: false,
    sleepHours: null,
    levels: { alcohol: 0, cigarettes: 0 },
    factors: [],
    products: [],
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

// Fills in fields missing from entries saved by older versions of the app.
export function normalizeEntry(e: Partial<Entry> & { date: string }): Entry {
  return { ...emptyEntry(e.date), ...e, levels: { ...emptyEntry(e.date).levels, ...(e.levels ?? {}) } };
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
