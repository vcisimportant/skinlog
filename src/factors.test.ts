import { describe, expect, test } from 'vitest';
import { migrateFactors, seedFactors } from './factors';
import { Entry, emptyEntry } from './types';

const day = (date: string, patch: Partial<Entry> = {}): Entry => ({ ...emptyEntry(date), ...patch });

describe('seedFactors', () => {
  test('starts everyone off with the built-in list, all active', () => {
    const seeded = seedFactors();
    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded.every((f) => !f.archived && f.id && f.name)).toBe(true);
  });

  test('gives each factor its own id', () => {
    const ids = seedFactors().map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('migrateFactors', () => {
  test('leaves days that already reference factors by id alone', () => {
    const factors = seedFactors();
    const entries = { '2026-09-01': day('2026-09-01', { factors: [factors[0].id] }) };
    const out = migrateFactors(entries, factors);
    expect(out.entries['2026-09-01'].factors).toEqual([factors[0].id]);
  });

  test('rewrites a day that stored the old factor label to the matching id', () => {
    const factors = seedFactors();
    const dairy = factors.find((f) => f.name === 'Dairy')!;
    const entries = { '2026-09-01': day('2026-09-01', { factors: ['Dairy'] }) };
    expect(migrateFactors(entries, factors).entries['2026-09-01'].factors).toEqual([dairy.id]);
  });

  test('keeps a label nobody recognises by inventing a factor for it', () => {
    const entries = { '2026-09-01': day('2026-09-01', { factors: ['Sauna'] }) };
    const out = migrateFactors(entries, seedFactors());
    const invented = out.factors.find((f) => f.name === 'Sauna');
    expect(invented).toBeDefined();
    expect(out.entries['2026-09-01'].factors).toEqual([invented!.id]);
  });

  test('invents the factor once even when several days used the same label', () => {
    const entries = {
      '2026-09-01': day('2026-09-01', { factors: ['Sauna'] }),
      '2026-09-02': day('2026-09-02', { factors: ['Sauna'] }),
    };
    const out = migrateFactors(entries, seedFactors());
    expect(out.factors.filter((f) => f.name === 'Sauna')).toHaveLength(1);
  });
});
