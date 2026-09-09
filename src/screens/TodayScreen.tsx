import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Chips } from '../components/Chips';
import { LevelChip } from '../components/LevelChip';
import { Scale } from '../components/Scale';
import { Stepper } from '../components/Stepper';
import { addDays, prettyDate, todayKey } from '../dates';
import { colors, radius, space } from '../theme';
import { Entry, FACTORS, LEVELS, Product, SCALES, emptyEntry } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  date: string;
  onChangeDate: (d: string) => void;
  onSave: (e: Entry) => void;
};

export function TodayScreen({ entries, products, date, onChangeDate, onSave }: Props) {
  const setDate = onChangeDate;
  const [draft, setDraft] = useState<Entry>(entries[date] ?? emptyEntry(date));
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(entries[date] ?? emptyEntry(date));
  }, [date, entries]);

  const update = (patch: Partial<Entry>) => setDraft((d) => ({ ...d, ...patch }));

  const toggleFactor = (f: string) =>
    update({
      factors: draft.factors.includes(f) ? draft.factors.filter((x) => x !== f) : [...draft.factors, f],
    });

  // Active products, plus any archived ones already ticked on this day so they stay visible.
  const pickable = products.filter((p) => !p.archived || draft.products.includes(p.id));
  const productNames = pickable.map((p) => p.name);
  const selectedNames = pickable.filter((p) => draft.products.includes(p.id)).map((p) => p.name);
  const toggleProduct = (name: string) => {
    const prod = pickable.find((p) => p.name === name);
    if (!prod) return;
    update({
      products: draft.products.includes(prod.id)
        ? draft.products.filter((x) => x !== prod.id)
        : [...draft.products, prod.id],
    });
  };

  const save = () => {
    onSave({ ...draft, updatedAt: new Date().toISOString() });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const canGoForward = date < todayKey();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.dateRow}>
          <Pressable accessibilityLabel="Previous day" onPress={() => setDate(addDays(date, -1))} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Pressable accessibilityLabel="Jump to today" onPress={() => setDate(todayKey())} style={{ alignItems: 'center' }}>
            <Text style={styles.dateBig}>{prettyDate(date)}</Text>
            <Text style={styles.dateSmall}>{date === todayKey() ? date : `${date}, tap to return to today`}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Next day"
            onPress={() => canGoForward && setDate(addDays(date, 1))}
            style={[styles.arrow, !canGoForward && { opacity: 0.25 }]}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>How does your skin look?</Text>
        {SCALES.map((s) => (
          <Scale
            key={s.key}
            label={s.label}
            low={s.low}
            high={s.high}
            value={draft[s.key]}
            onChange={(v) => update({ [s.key]: v })}
          />
        ))}

        <Text style={styles.section}>Products used today</Text>
        {pickable.length === 0 ? (
          <Text style={styles.hint}>Add your products on the Products tab and they'll show up here.</Text>
        ) : (
          <Chips options={productNames} selected={selectedNames} onToggle={toggleProduct} />
        )}

        <Text style={styles.section}>What happened today?</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((l) => (
            <LevelChip
              key={l.key}
              label={l.label}
              steps={l.steps}
              value={draft.levels[l.key]}
              onChange={(v) => update({ levels: { ...draft.levels, [l.key]: v } })}
            />
          ))}
        </View>
        <Chips options={FACTORS} selected={draft.factors} onToggle={toggleFactor} />

        <View style={styles.block}>
          <Stepper
            label="Sleep last night"
            value={draft.sleepHours}
            unit="h"
            step={0.5}
            min={0}
            max={14}
            onChange={(v) => update({ sleepHours: v })}
          />
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.period }}
            onPress={() => update({ period: !draft.period })}
            style={styles.periodRow}
          >
            <Text style={styles.periodLabel}>Period today</Text>
            <View style={[styles.toggle, draft.period && styles.toggleOn]}>
              <View style={[styles.knob, draft.period && styles.knobOn]} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.section}>Anything else</Text>
        <TextInput
          style={styles.notes}
          placeholder="New moisturiser, ate a lot of chocolate, travelling…"
          placeholderTextColor={colors.inkSoft}
          multiline
          value={draft.notes}
          onChangeText={(t) => update({ notes: t })}
        />

        <Pressable accessibilityRole="button" onPress={save} style={styles.save}>
          <Text style={styles.saveText}>{savedFlash ? 'Saved' : 'Save day'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingBottom: 48 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 34, color: colors.moss, lineHeight: 38 },
  dateBig: { fontSize: 30, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  dateSmall: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  section: { fontSize: 15, color: colors.inkSoft, marginBottom: space.md, marginTop: space.sm },
  hint: { fontSize: 14, color: colors.inkSoft },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  block: { marginTop: space.lg },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabel: { fontSize: 17, fontWeight: '600', color: colors.ink },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.line,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.flare },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface },
  knobOn: { alignSelf: 'flex-end' },
  notes: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.md,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.line,
  },
  save: {
    marginTop: space.lg,
    backgroundColor: colors.moss,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
