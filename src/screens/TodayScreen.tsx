import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
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
import { describeAge, daysSinceAdded, recentlyAdded } from '../tracked';
import { Palette, radius, space, usePalette } from '../theme';
import { Entry, Factor, LEVELS, LevelKey, Product, SCALES, Tracked, emptyEntry } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  factors: Factor[];
  date: string;
  onChangeDate: (d: string) => void;
  onSave: (e: Entry) => Promise<void>;
};

// How long to wait after the last edit before writing to the phone.
const SAVE_DELAY = 700;
const USUAL_SLEEP = 7;
const RECENT_DAYS = 21;

type Status = 'clean' | 'saving' | 'saved' | 'error';

// Retired entries stay pickable on days that already tick them, so history stays editable.
const pickable = (all: Tracked[], chosen: string[]) => all.filter((t) => !t.archived || chosen.includes(t.id));

export function TodayScreen({ entries, products, factors, date, onChangeDate, onSave }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [draft, setDraft] = useState<Entry>(() => entries[date] ?? emptyEntry(date));
  const [status, setStatus] = useState<Status>('clean');

  // Refs so the autosave timer and the save-on-leave can always reach the latest
  // values without re-running the effects that own them.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const dirtyRef = useRef(false);

  const flush = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setStatus('saving');
    onSaveRef.current({ ...draftRef.current, updatedAt: new Date().toISOString() }).then(
      () => setStatus('saved'),
      () => {
        // Leave it dirty so the next edit, or leaving the day, tries again.
        dirtyRef.current = true;
        setStatus('error');
      },
    );
  }, []);

  // Load the day being shown. Deliberately does not depend on `entries`: saving
  // replaces that object, and re-seeding the draft from it would fight the typing.
  useEffect(() => {
    setDraft(entriesRef.current[date] ?? emptyEntry(date));
    dirtyRef.current = false;
    setStatus('clean');
  }, [date]);

  // Autosave once editing pauses.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(flush, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [draft, flush]);

  // Save the day being left, whether that is another date, another tab, or closing.
  useEffect(() => flush, [date, flush]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  // Every edit goes through the updater form, so two taps landing in the same
  // render cannot overwrite each other.
  const edit = (fn: (d: Entry) => Entry) => {
    dirtyRef.current = true;
    setDraft(fn);
  };
  const update = (patch: Partial<Entry>) => edit((d) => ({ ...d, ...patch }));
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const today = todayKey();
  const productOptions = pickable(products, draft.products);
  const factorOptions = pickable(factors, draft.factors);
  // Only what is both new and actually used today, so setting the app up on day one
  // does not produce a wall of "new".
  const started = recentlyAdded(products, today, RECENT_DAYS).filter((p) => draft.products.includes(p.id));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.dateRow}>
          <Pressable accessibilityLabel="Previous day" onPress={() => onChangeDate(addDays(date, -1))} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Pressable accessibilityLabel="Jump to today" onPress={() => onChangeDate(today)} style={{ alignItems: 'center' }}>
            <Text style={styles.dateBig}>{prettyDate(date)}</Text>
            <Text style={styles.dateSmall}>{date === today ? date : `${date}, tap to return to today`}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Next day"
            onPress={() => date < today && onChangeDate(addDays(date, 1))}
            style={[styles.arrow, date >= today && { opacity: 0.25 }]}
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
        {productOptions.length === 0 ? (
          <Text style={styles.hint}>Add your products on the Setup tab and they'll show up here.</Text>
        ) : (
          <>
            <Chips
              options={productOptions.map((p) => ({ id: p.id, label: p.name }))}
              selected={draft.products}
              onToggle={(id) => edit((d) => ({ ...d, products: toggle(d.products, id) }))}
            />
            {started.length > 0 && started.length <= 2 ? (
              <Text style={styles.newHint}>
                {started.map((p) => `${p.name} — ${describeAge(daysSinceAdded(p, today))}`).join(' · ')}
              </Text>
            ) : null}
          </>
        )}

        <Text style={styles.section}>What happened today?</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((l) => (
            <LevelChip
              key={l.key}
              label={l.label}
              steps={l.steps}
              value={draft.levels[l.key]}
              onChange={(v) => edit((d) => ({ ...d, levels: { ...d.levels, [l.key as LevelKey]: v } }))}
            />
          ))}
        </View>
        {factorOptions.length === 0 ? (
          <Text style={styles.hint}>Add the things you want to track on the Setup tab.</Text>
        ) : (
          <Chips
            options={factorOptions.map((f) => ({ id: f.id, label: f.name }))}
            selected={draft.factors}
            onToggle={(id) => edit((d) => ({ ...d, factors: toggle(d.factors, id) }))}
          />
        )}

        <View style={styles.block}>
          <Stepper
            label="Sleep last night"
            value={draft.sleepHours}
            unit="h"
            step={0.5}
            min={0}
            max={14}
            start={USUAL_SLEEP}
            onChange={(v) => update({ sleepHours: v })}
          />
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.period }}
            onPress={() => edit((d) => ({ ...d, period: !d.period }))}
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
          placeholderTextColor={c.inkSoft}
          multiline
          value={draft.notes}
          onChangeText={(t) => update({ notes: t })}
        />

        <Text accessibilityLiveRegion="polite" style={[styles.status, status === 'error' && styles.statusError]}>
          {status === 'error'
            ? 'Could not save to this phone. Change something to try again.'
            : status === 'saving'
              ? 'Saving…'
              : status === 'saved'
                ? 'Saved'
                : 'Changes save themselves'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: space.lg, paddingBottom: 48 },
    dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
    arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    arrowText: { fontSize: 34, color: c.moss, lineHeight: 38 },
    dateBig: { fontSize: 30, fontWeight: '700', color: c.ink, letterSpacing: -0.5 },
    dateSmall: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
    section: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: c.inkSoft,
      marginTop: space.xl,
      marginBottom: space.md,
    },
    hint: { fontSize: 14, color: c.inkSoft },
    newHint: { fontSize: 13, color: c.inkSoft, marginTop: space.sm, lineHeight: 18 },
    levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
    block: { marginTop: space.lg },
    periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    periodLabel: { fontSize: 17, fontWeight: '600', color: c.ink },
    toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: c.line, padding: 3, justifyContent: 'center' },
    toggleOn: { backgroundColor: c.flare },
    knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.surface },
    knobOn: { alignSelf: 'flex-end' },
    notes: {
      minHeight: 80,
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: space.md,
      fontSize: 16,
      color: c.ink,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: c.line,
    },
    status: { marginTop: space.lg, fontSize: 14, color: c.inkSoft, textAlign: 'center' },
    statusError: { color: c.flare },
  });
