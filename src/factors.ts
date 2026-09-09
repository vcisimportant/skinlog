import { DEFAULT_FACTORS, Entry, Factor, newId } from './types';

export function seedFactors(): Factor[] {
  const createdAt = new Date().toISOString();
  return DEFAULT_FACTORS.map((name) => ({ id: newId(), name, archived: false, createdAt }));
}

// Days used to store factors by their label rather than by id. Rewrite them, and
// invent a factor for any label that matches nothing rather than dropping what the
// day recorded.
export function migrateFactors(
  entries: Record<string, Entry>,
  factors: Factor[],
): { entries: Record<string, Entry>; factors: Factor[] } {
  const ids = new Set(factors.map((f) => f.id));
  const byName = new Map(factors.map((f) => [f.name.toLowerCase(), f]));
  const invented: Factor[] = [];
  let changed = false;

  const out: Record<string, Entry> = {};
  for (const [date, e] of Object.entries(entries)) {
    const refs = e.factors.map((ref) => {
      if (ids.has(ref)) return ref;
      changed = true;
      const known = byName.get(ref.toLowerCase());
      if (known) return known.id;
      const made: Factor = { id: newId(), name: ref, archived: false, createdAt: new Date().toISOString() };
      ids.add(made.id);
      byName.set(made.name.toLowerCase(), made);
      invented.push(made);
      return made.id;
    });
    out[date] = { ...e, factors: refs };
  }

  return {
    entries: changed ? out : entries,
    factors: invented.length ? [...factors, ...invented] : factors,
  };
}
