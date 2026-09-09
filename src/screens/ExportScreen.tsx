import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { buildCsv } from '../csv';
import { Entry, Product } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  onClear: () => void;
};

export function ExportScreen({ entries, products, onClear }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const count = Object.keys(entries).length;
  const csv = useMemo(() => buildCsv(entries, products), [entries, products]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2000);
  };

  const copy = async () => {
    await Clipboard.setStringAsync(csv);
    flash('Copied. Paste it into a chat to analyse.');
  };

  const share = async () => {
    try {
      await Share.share({ message: csv, title: 'Skinlog export' });
    } catch {
      flash('Could not open the share sheet.');
    }
  };

  const confirmClear = () =>
    Alert.alert('Delete all entries?', 'This removes every logged day from this phone. Export first if you want to keep them.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: onClear },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.countLabel}>{count === 1 ? 'day logged' : 'days logged'}</Text>

      <Text style={styles.body}>
        The export is a CSV with one row per day. Cycle day is worked out automatically from the days you marked as period.
        Alcohol and cigarettes are 0, 1 or 2 (none, some, a lot). Each product gets its own column, including removed ones.
      </Text>

      <Pressable accessibilityRole="button" onPress={copy} disabled={count === 0} style={[styles.primary, count === 0 && styles.disabled]}>
        <Text style={styles.primaryText}>Copy CSV to clipboard</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={share} disabled={count === 0} style={[styles.secondary, count === 0 && styles.disabled]}>
        <Text style={styles.secondaryText}>Share as text</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.previewWrap}>
        <Text style={styles.previewLabel}>Preview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.preview}>{count === 0 ? 'No data yet.' : csv.split('\n').slice(0, 6).join('\n')}</Text>
        </ScrollView>
      </View>

      <Pressable accessibilityRole="button" onPress={confirmClear} style={styles.danger}>
        <Text style={styles.dangerText}>Delete all entries</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingBottom: 48 },
  count: { fontSize: 64, fontWeight: '700', color: colors.ink, letterSpacing: -2, lineHeight: 70 },
  countLabel: { fontSize: 17, color: colors.inkSoft, marginBottom: space.lg },
  body: { fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: space.lg },
  primary: { backgroundColor: colors.moss, borderRadius: radius.card, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  secondary: {
    marginTop: space.sm,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.moss,
  },
  secondaryText: { color: colors.moss, fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  status: { marginTop: space.md, color: colors.moss, fontSize: 15, textAlign: 'center' },
  previewWrap: { marginTop: space.xl, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.md },
  previewLabel: { fontSize: 13, color: colors.inkSoft, marginBottom: space.sm },
  preview: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12, color: colors.ink, lineHeight: 18 },
  danger: { marginTop: space.xl, alignItems: 'center', paddingVertical: 12 },
  dangerText: { color: colors.flare, fontSize: 15 },
});
