import { Entry, Factor, Product, Tracked, normalizeEntry } from './types';

export type Backup = {
  app: 'skinlog';
  version: 1;
  exportedAt: string;
  entries: Record<string, Entry>;
  products: Product[];
  factors: Factor[];
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function buildBackup(
  entries: Record<string, Entry>,
  products: Product[],
  factors: Factor[],
): Backup {
  return { app: 'skinlog', version: 1, exportedAt: new Date().toISOString(), entries, products, factors };
}

// Days reference products and factors by id, so a backup is only restorable if it
// carries the lists too.
const trackedList = (value: unknown): Tracked[] =>
  Array.isArray(value)
    ? value
        .filter((t): t is Tracked => !!t && typeof t.id === 'string' && typeof t.name === 'string')
        .map((t) => ({ ...t, archived: !!t.archived, createdAt: t.createdAt ?? new Date().toISOString() }))
    : [];

// Restoring replaces everything that is currently on the phone, so anything not
// clearly a Skinlog backup is rejected outright rather than half-imported. The
// message is written to be shown to the user as-is.
export function parseBackup(raw: string): Backup {
  const reject: () => never = () => {
    throw new Error('That file is not a Skinlog backup.');
  };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    reject();
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) reject();

  const b = data as Partial<Backup>;
  if (b.app !== 'skinlog') reject();
  if (!b.entries || typeof b.entries !== 'object' || Array.isArray(b.entries)) reject();
  if (!Array.isArray(b.products)) reject();

  const entries: Record<string, Entry> = {};
  for (const [date, value] of Object.entries(b.entries)) {
    if (!DATE_KEY.test(date) || !value || typeof value !== 'object') reject();
    entries[date] = normalizeEntry({ ...(value as Partial<Entry>), date });
  }

  return {
    app: 'skinlog',
    version: 1,
    exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : new Date().toISOString(),
    entries,
    products: trackedList(b.products),
    factors: trackedList(b.factors),
  };
}
