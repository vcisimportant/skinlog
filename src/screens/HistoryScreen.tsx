import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Trends } from '../components/Trends';
import { addDays, prettyDate, todayKey } from '../dates';
import { Palette, radius, space, usePalette } from '../theme';
import { Entry, Factor, LEVELS, Product, SCALES } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  factors: Factor[];
  onPickDate: (date: string) => void;
};

type Row = { date: string; entry: Entry | null };

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

export function HistoryScreen({ entries, products, factors, onPickDate }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const today = todayKey();
  const rows = useMemo(() => buildRows(entries), [entries]);
  const missed = rows.filter((r) => !r.entry && r.date !== today).length;

  const nameOf = (list: { id: string; name: string }[], id: string) =>
    list.find((x) => x.id === id)?.name ?? 'removed';

  // The value sits inside the pip, so the row still reads once the legend has
  // scrolled off the top.
  const Pip = ({ value }: { value: number | null }) => (
    <View style={[styles.pip, value ? { backgroundColor: c.scale[value - 1] } : styles.pipEmpty]}>
      {value ? <Text style={styles.pipText}>{value}</Text> : null}
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.date}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <Trends entries={entries} />
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
                  ...e.factors.map((id) => nameOf(factors, id).toLowerCase()),
                ]
                  .filter(Boolean)
                  .join(', ') || 'no factors logged'}
              </Text>
            ) : null}
            {e && e.products.length > 0 ? (
              <Text style={styles.products}>{e.products.map((id) => nameOf(products, id)).join(', ')}</Text>
            ) : null}
            {e?.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
          </Pressable>
        );
      }}
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: space.lg, paddingBottom: 48 },
    hint: { fontSize: 14, color: c.inkSoft, marginBottom: space.md, marginTop: space.sm },
    legend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: space.sm, paddingRight: 2 },
    legendText: { fontSize: 11, color: c.inkSoft, width: 52, textAlign: 'center' },
    card: { backgroundColor: c.surface, borderRadius: radius.card, padding: space.md, marginBottom: space.sm },
    cardEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.line, borderStyle: 'dashed' },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { fontSize: 17, fontWeight: '600', color: c.ink },
    dateEmpty: { color: c.inkSoft, fontWeight: '500' },
    addText: { fontSize: 13, color: c.moss },
    pips: { flexDirection: 'row', gap: 6 },
    pip: { width: 52, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    pipEmpty: { borderWidth: 1, borderColor: c.line },
    pipText: { fontSize: 11, fontWeight: '700', color: c.onAccent },
    meta: { fontSize: 14, color: c.inkSoft, marginTop: 6 },
    products: { fontSize: 14, color: c.moss, marginTop: 4 },
    notes: { fontSize: 14, color: c.ink, marginTop: 6 },
  });
