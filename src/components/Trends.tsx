import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { todayKey } from '../dates';
import { Palette, radius, space, usePalette } from '../theme';
import { cycleAverages, loggedInLast, recentValues } from '../trends';
import { Entry, SCALES } from '../types';

const WINDOW = 60; // days shown in the strip
const CYCLE_DAYS = 35;
const MIN_DAYS = 7; // below this, a chart is noise dressed up as a pattern
const BAR_H = 44;

const short = (label: string) => label.split(' ')[0];

export function Trends({ entries }: { entries: Record<string, Entry> }) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const today = todayKey();
  const total = Object.keys(entries).length;

  if (total < MIN_DAYS) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.hint}>
          Nothing worth drawing yet — {total} {total === 1 ? 'day' : 'days'} logged. Patterns start showing after a
          week or two, and the cycle view needs two periods behind it.
        </Text>
      </View>
    );
  }

  const strips = SCALES.map((s) => ({ key: s.key, label: s.label, values: recentValues(entries, s.key, WINDOW, today) }));
  const cycles = SCALES.map((s) => ({ key: s.key, label: s.label, days: cycleAverages(entries, s.key, CYCLE_DAYS) }));
  const cyclesReady = cycles.some((s) => s.days.some((d) => d.samples >= 2));

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.title}>Last {WINDOW} days</Text>
        <Text style={styles.sub}>Logged {loggedInLast(entries, 30, today)} of the last 30 days.</Text>
        {strips.map((s) => (
          <View key={s.key} style={styles.row}>
            <Text style={styles.rowLabel}>{short(s.label)}</Text>
            <View style={styles.strip}>
              {s.values.map((v, i) => (
                <View
                  key={i}
                  style={[styles.tick, v === null ? styles.tickEmpty : { backgroundColor: c.scale[v - 1] }]}
                />
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.legend}>Green is calm, red is bad. Faint marks are days you did not log.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Across your cycle</Text>
        {cyclesReady ? (
          <>
            <Text style={styles.sub}>
              Averaged over every cycle you have logged, so a hormonal pattern shows up where a plain calendar hides it.
            </Text>
            {cycles.map((s) => (
              <View key={s.key} style={styles.row}>
                <Text style={styles.rowLabel}>{short(s.label)}</Text>
                <View style={styles.bars}>
                  {s.days.map((d) => (
                    <View key={d.day} style={styles.slot}>
                      <View
                        style={
                          d.average === null
                            ? styles.barEmpty
                            : {
                                height: Math.max(2, Math.round((d.average / 5) * BAR_H)),
                                backgroundColor: c.scale[Math.min(4, Math.max(0, Math.round(d.average) - 1))],
                                borderRadius: 1,
                              }
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <Text style={styles.legend}>Cycle day 1 to {CYCLE_DAYS}, left to right. Taller is worse.</Text>
          </>
        ) : (
          <Text style={styles.hint}>
            Needs two periods logged before an average across cycles means anything. Keep marking period days.
          </Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: space.md,
      marginBottom: space.sm,
    },
    title: { fontSize: 17, fontWeight: '700', color: c.ink },
    sub: { fontSize: 13, color: c.inkSoft, marginTop: 2, marginBottom: space.md },
    hint: { fontSize: 14, color: c.inkSoft, lineHeight: 20, marginTop: space.sm },
    row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.sm },
    rowLabel: { width: 62, fontSize: 12, color: c.inkSoft },
    strip: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 18 },
    tick: { flex: 1, height: 18, marginHorizontal: 0.5, borderRadius: 1 },
    tickEmpty: { flex: 1, height: 4, marginHorizontal: 0.5, borderRadius: 1, backgroundColor: c.line },
    bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: BAR_H },
    slot: { flex: 1, marginHorizontal: 0.5, justifyContent: 'flex-end' },
    barEmpty: { height: 2, backgroundColor: c.line, borderRadius: 1 },
    legend: { fontSize: 12, color: c.inkSoft, marginTop: space.xs },
  });
