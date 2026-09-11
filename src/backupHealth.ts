import { daysBetween } from './dates';

const STALE_AFTER = 14;

export type BackupWarning = {
  level: 'never' | 'stale' | 'shrunk';
  message: string;
};

type Input = {
  days: number; // days currently logged
  lastBackupAt: string | null;
  lastBackupDays: number; // days the last backup held
  today: string;
};

// The gap since the last backup is the most you can lose, so the app says so
// rather than leaving it to be remembered.
export function backupStatus({ days, lastBackupAt, lastBackupDays, today }: Input): BackupWarning | null {
  if (days === 0) return null;

  // Fewer days than the last backup held means something was cleared. Saving now
  // would overwrite a good backup with a worse one, so this outranks everything.
  if (lastBackupDays > days) {
    return {
      level: 'shrunk',
      message: `This phone holds ${days} ${days === 1 ? 'day' : 'days'}, but your last backup held ${lastBackupDays}. Something has been cleared — restore from that backup before saving a new one, or you will overwrite it.`,
    };
  }

  if (!lastBackupAt) {
    return {
      level: 'never',
      message: `You have never saved a backup. All ${days} ${days === 1 ? 'day' : 'days'} live only on this phone.`,
    };
  }

  const since = daysBetween(lastBackupAt.slice(0, 10), today);
  if (since >= STALE_AFTER) {
    return {
      level: 'stale',
      message: `Your last backup was ${since} days ago. Anything logged since then lives only on this phone.`,
    };
  }

  return null;
}
