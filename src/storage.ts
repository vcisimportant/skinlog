import { getItem, removeItem, setItem } from './kv';
import { Entry, Factor, Product, normalizeEntry } from './types';

const ENTRIES = 'skinlog:entries:v1';
const PRODUCTS = 'skinlog:products:v1';
const FACTORS = 'skinlog:factors:v1';
const SETTINGS = 'skinlog:settings:v1';

export type Settings = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  lastBackupAt: string | null; // ISO date of the last backup saved
  lastBackupDays: number; // how many days that backup held
};

export const DEFAULT_SETTINGS: Settings = {
  reminderEnabled: false,
  reminderHour: 21,
  reminderMinute: 0,
  lastBackupAt: null,
  lastBackupDays: 0,
};

export async function loadEntries(): Promise<Record<string, Entry>> {
  try {
    const raw = await getItem(ENTRIES);
    const parsed: Record<string, Entry> = raw ? JSON.parse(raw) : {};
    const out: Record<string, Entry> = {};
    for (const k of Object.keys(parsed)) out[k] = normalizeEntry(parsed[k]);
    return out;
  } catch {
    return {};
  }
}

export async function saveEntries(entries: Record<string, Entry>): Promise<void> {
  await setItem(ENTRIES, JSON.stringify(entries));
}

export async function clearEntries(): Promise<void> {
  await removeItem(ENTRIES);
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const raw = await getItem(PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await setItem(PRODUCTS, JSON.stringify(products));
}

// null means the list has never been saved, so the caller seeds the defaults.
// An empty array means the user genuinely removed everything, which is respected.
export async function loadFactors(): Promise<Factor[] | null> {
  try {
    const raw = await getItem(FACTORS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveFactors(factors: Factor[]): Promise<void> {
  await setItem(FACTORS, JSON.stringify(factors));
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await getItem(SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setItem(SETTINGS, JSON.stringify(settings));
}
