import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Backup } from './src/backup';
import { ExportScreen } from './src/screens/ExportScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { clearEntries, loadEntries, loadProducts, saveEntries, saveProducts } from './src/storage';
import { colors, space } from './src/theme';
import { Entry, Product } from './src/types';
import { todayKey } from './src/dates';

type Tab = 'today' | 'history' | 'products' | 'export';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'products', label: 'Products' },
  { id: 'export', label: 'Export' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [entries, setEntries] = useState<Record<string, Entry> | null>(null);
  const [date, setDate] = useState(todayKey());
  const [products, setProducts] = useState<Product[]>([]);

  // Mirrors of the state, so a save that lands while another is in flight builds
  // on the newer value rather than on whatever this render closed over.
  const entriesRef = useRef<Record<string, Entry>>({});
  const productsRef = useRef<Product[]>([]);

  useEffect(() => {
    loadProducts().then((p) => {
      productsRef.current = p;
      setProducts(p);
    });
    loadEntries().then((e) => {
      entriesRef.current = e;
      setEntries(e);
    });
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
    saveProducts(next).catch(() =>
      Alert.alert('Could not save', 'Your products could not be written to this phone.'),
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
    setEntries(backup.entries);
    setProducts(backup.products);
    await Promise.all([saveEntries(backup.entries), saveProducts(backup.products)]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {entries === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.moss} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {tab === 'today' && (
            <TodayScreen entries={entries} products={products} date={date} onChangeDate={setDate} onSave={handleSave} />
          )}
          {tab === 'history' && (
            <HistoryScreen
              entries={entries}
              products={products}
              onPickDate={(d) => {
                setDate(d);
                setTab('today');
              }}
            />
          )}
          {tab === 'products' && <ProductsScreen products={products} onChange={handleProducts} />}
          {tab === 'export' && (
            <ExportScreen entries={entries} products={products} onClear={handleClear} onRestore={handleRestore} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingBottom: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: space.md },
  tabText: { fontSize: 15, color: colors.inkSoft },
  tabTextOn: { color: colors.ink, fontWeight: '600' },
  tabMark: { width: 24, height: 3, borderRadius: 2, marginTop: 6, backgroundColor: 'transparent' },
  tabMarkOn: { backgroundColor: colors.moss },
});
