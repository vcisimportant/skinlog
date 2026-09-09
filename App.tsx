import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Backup } from './src/backup';
import { todayKey } from './src/dates';
import { migrateFactors, seedFactors } from './src/factors';
import { applyReminder } from './src/notifications';
import { ExportScreen } from './src/screens/ExportScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import {
  DEFAULT_SETTINGS,
  Settings,
  clearEntries,
  loadEntries,
  loadFactors,
  loadProducts,
  loadSettings,
  saveEntries,
  saveFactors,
  saveProducts,
  saveSettings,
} from './src/storage';
import { Palette, space, usePalette } from './src/theme';
import { Entry, Factor, Product } from './src/types';

type Tab = 'today' | 'history' | 'setup' | 'export';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'setup', label: 'Setup' },
  { id: 'export', label: 'Export' },
];

export default function App() {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [tab, setTab] = useState<Tab>('today');
  const [entries, setEntries] = useState<Record<string, Entry> | null>(null);
  const [date, setDate] = useState(todayKey());
  const [products, setProducts] = useState<Product[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Mirrors of the state, so a save that lands while another is in flight builds
  // on the newer value rather than on whatever this render closed over.
  const entriesRef = useRef<Record<string, Entry>>({});
  const productsRef = useRef<Product[]>([]);
  const factorsRef = useRef<Factor[]>([]);

  useEffect(() => {
    (async () => {
      const [storedProducts, storedFactors, storedEntries, storedSettings] = await Promise.all([
        loadProducts(),
        loadFactors(),
        loadEntries(),
        loadSettings(),
      ]);

      // First run seeds the built-in factor list; older days that stored factors by
      // label rather than by id are rewritten once, here.
      const seeded = storedFactors ?? seedFactors();
      const migrated = migrateFactors(storedEntries, seeded);

      entriesRef.current = migrated.entries;
      productsRef.current = storedProducts;
      factorsRef.current = migrated.factors;
      setEntries(migrated.entries);
      setProducts(storedProducts);
      setFactors(migrated.factors);
      setSettings(storedSettings);

      if (!storedFactors || migrated.factors !== seeded) await saveFactors(migrated.factors);
      if (migrated.entries !== storedEntries) await saveEntries(migrated.entries);

      // Re-arm on every launch, in case iOS dropped the schedule.
      applyReminder(storedSettings).catch(() => {});
    })();
  }, []);

  // The day does not change while the app sits open overnight, so catch up when
  // it comes back to the foreground — but only if today is what is on screen.
  const shownTodayRef = useRef(todayKey());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      const now = todayKey();
      const wasToday = shownTodayRef.current;
      if (now === wasToday) return;
      shownTodayRef.current = now;
      setDate((d) => (d === wasToday ? now : d));
    });
    return () => sub.remove();
  }, []);

  // Rejections are deliberately passed on: the Today screen shows a save failure
  // rather than telling you it saved when it did not.
  const handleSave = (e: Entry) => {
    const next = { ...entriesRef.current, [e.date]: e };
    entriesRef.current = next;
    setEntries(next);
    return saveEntries(next);
  };

  const handleProducts = (next: Product[]) => {
    productsRef.current = next;
    setProducts(next);
    saveProducts(next).catch(() => Alert.alert('Could not save', 'Your products could not be written to this phone.'));
  };

  const handleFactors = (next: Factor[]) => {
    factorsRef.current = next;
    setFactors(next);
    saveFactors(next).catch(() => Alert.alert('Could not save', 'Your factors could not be written to this phone.'));
  };

  // A switch that is on but silent is worse than one that admits it is off, so a
  // refused permission is turned back off and said out loud.
  const handleSettings = async (next: Settings) => {
    setSettings(next);
    await saveSettings(next);
    if (await applyReminder(next)) return;
    const off = { ...next, reminderEnabled: false };
    setSettings(off);
    await saveSettings(off);
    Alert.alert(
      'Notifications are turned off',
      'Allow notifications for Skinlog in the iPhone Settings app, then switch the reminder back on.',
    );
  };

  const handleClear = async () => {
    entriesRef.current = {};
    setEntries({});
    await clearEntries();
  };

  const handleRestore = async (backup: Backup) => {
    entriesRef.current = backup.entries;
    productsRef.current = backup.products;
    factorsRef.current = backup.factors;
    setEntries(backup.entries);
    setProducts(backup.products);
    setFactors(backup.factors);
    await Promise.all([
      saveEntries(backup.entries),
      saveProducts(backup.products),
      saveFactors(backup.factors),
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      {entries === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={c.moss} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {tab === 'today' && (
            <TodayScreen
              entries={entries}
              products={products}
              factors={factors}
              date={date}
              onChangeDate={setDate}
              onSave={handleSave}
            />
          )}
          {tab === 'history' && (
            <HistoryScreen
              entries={entries}
              products={products}
              factors={factors}
              onPickDate={(d) => {
                setDate(d);
                setTab('today');
              }}
            />
          )}
          {tab === 'setup' && (
            <SetupScreen
              products={products}
              factors={factors}
              settings={settings}
              onChangeProducts={handleProducts}
              onChangeFactors={handleFactors}
              onChangeSettings={handleSettings}
            />
          )}
          {tab === 'export' && (
            <ExportScreen
              entries={entries}
              products={products}
              factors={factors}
              onClear={handleClear}
              onRestore={handleRestore}
            />
          )}
        </View>
      )}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={styles.tab}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>{t.label}</Text>
            <View style={[styles.tabMark, tab === t.id && styles.tabMarkOn]} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabs: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.surface,
      paddingBottom: space.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingTop: space.md },
    tabText: { fontSize: 15, color: c.inkSoft },
    tabTextOn: { color: c.ink, fontWeight: '600' },
    tabMark: { width: 24, height: 3, borderRadius: 2, marginTop: 6, backgroundColor: 'transparent' },
    tabMarkOn: { backgroundColor: c.moss },
  });
