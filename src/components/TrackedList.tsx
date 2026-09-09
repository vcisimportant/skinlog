import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { todayKey } from '../dates';
import { describeAge, daysSinceAdded } from '../tracked';
import { Palette, radius, space, usePalette } from '../theme';
import { Tracked, newId } from '../types';

type Props = {
  title: string;
  intro: string;
  placeholder: string;
  removeNote: string;
  items: Tracked[];
  onChange: (items: Tracked[]) => void;
  showAge?: boolean;
};

// Products and factors are edited exactly the same way, so they share this.
export function TrackedList({ title, intro, placeholder, removeNote, items, onChange, showAge }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [name, setName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const today = todayKey();

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Duplicates are indistinguishable in the picker and collide into one column
    // in the export, so keep the names unique.
    if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Already on the list', `You already have "${trimmed}".`);
      return;
    }
    onChange([...items, { id: newId(), name: trimmed, archived: false, createdAt: new Date().toISOString() }]);
    setName('');
  };

  const setArchived = (id: string, archived: boolean) =>
    onChange(items.map((i) => (i.id === id ? { ...i, archived } : i)));

  const confirmArchive = (item: Tracked) =>
    Alert.alert(`Remove ${item.name}?`, removeNote, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setArchived(item.id, true) },
    ]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.intro}>{intro}</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={c.inkSoft}
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable accessibilityRole="button" onPress={add} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {active.length === 0 ? (
        <Text style={styles.empty}>Nothing here yet.</Text>
      ) : (
        active.map((i) => {
          const age = daysSinceAdded(i, today);
          return (
            <View key={i.id} style={styles.row}>
              <View style={{ flex: 1, marginRight: space.md }}>
                <Text style={styles.name}>{i.name}</Text>
                {showAge && age <= 30 ? <Text style={styles.age}>{describeAge(age)}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" onPress={() => confirmArchive(i)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          );
        })
      )}

      {archived.length > 0 ? (
        <View style={styles.archivedWrap}>
          <Pressable onPress={() => setShowArchived((s) => !s)} style={styles.archivedToggle}>
            <Text style={styles.archivedTitle}>
              {showArchived ? 'Hide' : 'Show'} removed ({archived.length})
            </Text>
          </Pressable>
          {showArchived
            ? archived.map((i) => (
                <View key={i.id} style={styles.row}>
                  <Text style={[styles.name, styles.nameArchived]}>{i.name}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setArchived(i.id, false)} hitSlop={8}>
                    <Text style={styles.restore}>Restore</Text>
                  </Pressable>
                </View>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { marginBottom: space.xl },
    title: { fontSize: 20, fontWeight: '700', color: c.ink, marginBottom: space.xs },
    intro: { fontSize: 15, color: c.inkSoft, lineHeight: 22, marginBottom: space.md },
    addRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: space.md,
      paddingVertical: 12,
      fontSize: 16,
      color: c.ink,
    },
    addBtn: {
      backgroundColor: c.moss,
      borderRadius: radius.control,
      paddingHorizontal: 18,
      justifyContent: 'center',
    },
    addBtnText: { color: c.onAccent, fontSize: 16, fontWeight: '600' },
    empty: { fontSize: 15, color: c.inkSoft },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.card,
      paddingVertical: 14,
      paddingHorizontal: space.md,
      marginBottom: space.sm,
    },
    name: { fontSize: 16, color: c.ink },
    age: { fontSize: 13, color: c.moss, marginTop: 2 },
    nameArchived: { color: c.inkSoft, flex: 1, marginRight: space.md },
    remove: { fontSize: 15, color: c.flare },
    restore: { fontSize: 15, color: c.moss },
    archivedWrap: { marginTop: space.sm },
    archivedToggle: { paddingVertical: space.sm, marginBottom: space.sm },
    archivedTitle: { fontSize: 15, color: c.inkSoft },
  });
