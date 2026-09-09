import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, prettyDate, todayKey } from '../dates';
import { colors, radius, scaleColors, space } from '../theme';
import { Entry, LEVELS, Product, SCALES } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  onPickDate: (date: string) => void;
};

type Row = { date: string; entry: Entry | null };

function Pip({ value }: { value: number | null }) {
  return (
    <View
      style={[
        styles.pip,
        value ? { backgroundColor: scaleColors[value - 1] } : { borderWidth: 1, borderColor: colors.line },
      ]}
    />
  );
}

// Every day from the earliest entry (or 14 days ago, whichever is earlier) up to today,
// newest first, so gaps are visible and tappable.
function buildRows(entries: Record<string, Entry>): Row[] {
  const today = todayKey();
  const keys = Object.keys(entries).sort();
  let start = addDays(today, -14);
  if (keys.length && keys[0] < start) start = keys[0];
  const rows: Row[] = [];
  for (let d = today; d >= start; d = addDays(d, -1)) {
    rows.push({ date: d, entry: entries[d] ?? null });
  }
  return rows;
}

export function HistoryScreen({ entries, products, onPickDate }: Props) {
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? 'unknown product';
  const rows = buildRows(entries);
  const missed = rows.filter((r) => !r.entry && r.date !== todayKey()).length;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.date}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          {missed > 0 ? (
            <Text style={styles.hint}>
              {missed} {missed === 1 ? 'day' : 'days'} not logged. Tap any day to fill it in.
            </Text>
          ) : null}
          <View style={styles.legend}>
            {SCALES.map((s) => (
              <Text key={s.key} style={styles.legendText}>
                {s.label.split(' ')[0].toLowerCase()}
              </Text>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const e = item.entry;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${prettyDate(item.date)}, ${e ? 'edit' : 'not logged, add'}`}
            onPress={() => onPickDate(item.date)}
            style={({ pressed }) => [styles.card, !e && styles.cardEmpty, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.head}>
              <Text style={[styles.date, !e && styles.dateEmpty]}>{prettyDate(item.date)}</Text>
              {e ? (
                <View style={styles.pips}>
                  <Pip value={e.redness} />
                  <Pip value={e.oiliness} />
                  <Pip value={e.spots} />
                </View>
              ) : (
                <Text style={styles.addText}>Not logged, tap to add</Text>
              )}
            </View>
            {e ? (
              <Text style={styles.meta}>
                {[
                  e.period ? 'period' : null,
                  e.sleepHours !== null ? `${e.sleepHours}h sleep` : null,
                  ...LEVELS.filter((l) => e.levels[l.key] > 0).map(
                    (l) => `${l.label.toLowerCase()} (${l.steps[e.levels[l.key] - 1]})`,
                  ),
                  ...e.factors.map((f) => f.toLowerCase()),
                ]
                  .filter(Boolean)
                  .join(', ') || 'no factors logged'}
              </Text>
            ) : null}
            {e && e.products.length > 0 ? (
              <Text style={styles.products}>{e.products.map(productName).join(', ')}</Text>
            ) : null}
            {e?.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingBottom: 48 },
  hint: { fontSize: 14, color: colors.inkSoft, marginBottom: space.md },
  legend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: space.sm, paddingRight: 2 },
  legendText: { fontSize: 11, color: colors.inkSoft, width: 52, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.sm,
  },
  cardEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 17, fontWeight: '600', color: colors.ink },
  dateEmpty: { color: colors.inkSoft, fontWeight: '500' },
  addText: { fontSize: 13, color: colors.moss },
  pips: { flexDirection: 'row', gap: 6 },
  pip: { width: 52, height: 14, borderRadius: 7 },
  meta: { fontSize: 14, color: colors.inkSoft, marginTop: 6 },
  products: { fontSize: 14, color: colors.moss, marginTop: 4 },
  notes: { fontSize: 14, color: colors.ink, marginTop: 6 },
});
