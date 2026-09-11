import { describe, expect, test } from 'vitest';
import { backupStatus } from './backupHealth';

const at = (date: string) => `${date}T09:00:00.000Z`;

describe('backupStatus', () => {
  test('says nothing when there is nothing logged yet', () => {
    expect(backupStatus({ days: 0, lastBackupAt: null, lastBackupDays: 0, today: '2026-09-11' })).toBeNull();
  });

  test('says nothing when the last backup was recent', () => {
    const s = backupStatus({ days: 20, lastBackupAt: at('2026-09-08'), lastBackupDays: 17, today: '2026-09-11' });
    expect(s).toBeNull();
  });

  test('flags a diary that has never been backed up', () => {
    const s = backupStatus({ days: 3, lastBackupAt: null, lastBackupDays: 0, today: '2026-09-11' });
    expect(s?.level).toBe('never');
  });

  test('flags a backup that has gone stale, and says how long', () => {
    const s = backupStatus({ days: 40, lastBackupAt: at('2026-08-01'), lastBackupDays: 20, today: '2026-09-11' });
    expect(s?.level).toBe('stale');
    expect(s?.message).toContain('41');
  });

  test('warns loudly when there is now less data than the last backup held', () => {
    // The wipe-then-overwrite trap: backing up here would destroy the good file.
    const s = backupStatus({ days: 2, lastBackupAt: at('2026-09-10'), lastBackupDays: 60, today: '2026-09-11' });
    expect(s?.level).toBe('shrunk');
    expect(s?.message).toMatch(/restore/i);
  });

  test('the shrunk warning outranks a merely stale one', () => {
    const s = backupStatus({ days: 2, lastBackupAt: at('2026-01-01'), lastBackupDays: 60, today: '2026-09-11' });
    expect(s?.level).toBe('shrunk');
  });
});
