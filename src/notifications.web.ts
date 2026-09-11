import { Settings } from './storage';

// A browser cannot schedule a repeating daily local notification on iOS, so the
// reminder is hidden on web and this keeps the call site free of platform checks.
export async function applyReminder(_settings: Settings): Promise<boolean> {
  return true;
}
