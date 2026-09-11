// AsyncStorage on web is a thin wrapper over localStorage: a 5MB cap, and the
// first thing Safari discards when it tidies up. A diary is not a cache, so on
// web the data goes in IndexedDB instead, which browsers treat as real app data
// and which can be marked persistent.

const DB_NAME = 'skinlog';
const STORE = 'kv';
const LEGACY_PREFIX = 'skinlog:';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function getItem(key: string): Promise<string | null> {
  const value = await run<string | undefined>('readonly', (s) => s.get(key));
  if (value !== undefined) return value;
  // Anything written by an earlier version through localStorage is pulled across
  // the first time it is asked for, then written back to IndexedDB.
  const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  if (legacy !== null && key.startsWith(LEGACY_PREFIX)) {
    await setItem(key, legacy);
    return legacy;
  }
  return null;
}

export async function setItem(key: string, value: string): Promise<void> {
  await run('readwrite', (s) => s.put(value, key));
}

export async function removeItem(key: string): Promise<void> {
  await run('readwrite', (s) => s.delete(key));
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable; the IndexedDB delete above is what counts.
  }
}

// Asks the browser to exempt this origin from routine eviction. Safari generally
// grants it once the site is on the Home Screen and used regularly.
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
