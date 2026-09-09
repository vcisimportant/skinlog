import { describe, expect, test } from 'vitest';
import { buildBackup, parseBackup } from './backup';
import { emptyEntry } from './types';

const validRaw = () =>
  JSON.stringify(buildBackup({ '2026-09-01': emptyEntry('2026-09-01') }, [], []));

describe('parseBackup', () => {
  test('reads back what buildBackup wrote', () => {
    const restored = parseBackup(validRaw());
    expect(Object.keys(restored.entries)).toEqual(['2026-09-01']);
  });

  test('refuses a file that is not JSON at all', () => {
    expect(() => parseBackup('date,redness\n2026-09-01,3')).toThrow(/not a Skinlog backup/i);
  });

  test('refuses JSON that is not a Skinlog backup', () => {
    expect(() => parseBackup('{"hello":"world"}')).toThrow(/not a Skinlog backup/i);
  });

  test('refuses a backup whose days are not dates', () => {
    const bad = JSON.parse(validRaw());
    bad.entries = { notadate: emptyEntry('notadate') };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/not a Skinlog backup/i);
  });

  test('fills in fields a backup from an older version was missing', () => {
    const old = JSON.parse(validRaw());
    old.entries['2026-09-01'] = { date: '2026-09-01', redness: 3 };
    const restored = parseBackup(JSON.stringify(old));
    expect(restored.entries['2026-09-01']).toMatchObject({ redness: 3, factors: [], products: [], notes: '' });
  });

  test('keeps the products so restored days still name them', () => {
    const withProduct = JSON.parse(validRaw());
    withProduct.products = [{ id: 'p1', name: 'Cerave', archived: false, createdAt: '2026-01-01T00:00:00.000Z' }];
    expect(parseBackup(JSON.stringify(withProduct)).products).toHaveLength(1);
  });

  test('carries the factor list, without which restored days name nothing', () => {
    const withFactor = JSON.parse(validRaw());
    withFactor.factors = [{ id: 'f1', name: 'Dairy', archived: false, createdAt: '2026-01-01T00:00:00.000Z' }];
    expect(parseBackup(JSON.stringify(withFactor)).factors).toHaveLength(1);
  });

  test('an older backup with no factor list restores with an empty one rather than failing', () => {
    const old = JSON.parse(validRaw());
    delete old.factors;
    expect(parseBackup(JSON.stringify(old)).factors).toEqual([]);
  });
});
