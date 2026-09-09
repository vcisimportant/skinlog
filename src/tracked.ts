import { daysBetween } from './dates';
import { Tracked } from './types';

export function daysSinceAdded(item: Tracked, today: string): number {
  return daysBetween(item.createdAt.slice(0, 10), today);
}

export function describeAge(days: number): string {
  if (days <= 0) return 'added today';
  if (days === 1) return 'added yesterday';
  return `added ${days} days ago`;
}

// Something started recently is the obvious suspect when skin turns, so it is
// worth surfacing while logging rather than leaving it buried in a list.
export function recentlyAdded<T extends Tracked>(items: T[], today: string, within: number): T[] {
  return items.filter((i) => !i.archived && daysSinceAdded(i, today) <= within);
}
