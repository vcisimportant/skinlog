import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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

  useEffect(() => {
    loadProducts().then(setProducts);
    loadEntries().then(setEntries);
  }, []);

  const handleSave = async (e: Entry) => {
    const next = { ...(entries ?? {}), [e.date]: e };
    setEntries(next);
    await saveEntries(next);
  };

  const handleProducts = async (next: Product[]) => {
    setProducts(next);
    await saveProducts(next);
  };

  const handleClear = async () => {
    setEntries({});
    await clearEntries();
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
          {tab === 'export' && <ExportScreen entries={entries} products={products} onClear={handleClear} />}
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
