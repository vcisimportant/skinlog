import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry, Product, normalizeEntry } from './types';

const ENTRIES = 'skinlog:entries:v1';
const PRODUCTS = 'skinlog:products:v1';

export async function loadEntries(): Promise<Record<string, Entry>> {
  try {
    const raw = await AsyncStorage.getItem(ENTRIES);
    const parsed: Record<string, Entry> = raw ? JSON.parse(raw) : {};
    const out: Record<string, Entry> = {};
    for (const k of Object.keys(parsed)) out[k] = normalizeEntry(parsed[k]);
    return out;
  } catch {
    return {};
  }
}

export async function saveEntries(entries: Record<string, Entry>): Promise<void> {
  await AsyncStorage.setItem(ENTRIES, JSON.stringify(entries));
}

export async function clearEntries(): Promise<void> {
  await AsyncStorage.removeItem(ENTRIES);
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(PRODUCTS, JSON.stringify(products));
}
