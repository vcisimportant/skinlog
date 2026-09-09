import { describe, expect, test } from 'vitest';
import { describeAge, recentlyAdded } from './tracked';
import { Tracked } from './types';

const item = (name: string, createdAt: string, archived = false): Tracked => ({
  id: name,
  name,
  archived,
  createdAt,
});

describe('describeAge', () => {
  test('reads naturally for the first two days', () => {
    expect([describeAge(0), describeAge(1)]).toEqual(['added today', 'added yesterday']);
  });

  test('counts days after that', () => {
    expect(describeAge(12)).toBe('added 12 days ago');
  });
});

describe('recentlyAdded', () => {
  test('finds what was added inside the window', () => {
    const items = [item('New', '2026-08-28T09:00:00.000Z'), item('Old', '2026-01-01T09:00:00.000Z')];
    expect(recentlyAdded(items, '2026-09-09', 30).map((i) => i.name)).toEqual(['New']);
  });

  test('ignores things that were removed, however recently they were added', () => {
    const items = [item('Gone', '2026-09-08T09:00:00.000Z', true)];
    expect(recentlyAdded(items, '2026-09-09', 30)).toEqual([]);
  });
});
