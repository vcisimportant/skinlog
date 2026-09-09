import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, space } from '../theme';
import { Product, newId } from '../types';

type Props = {
  products: Product[];
  onChange: (products: Product[]) => void;
};

export function ProductsScreen({ products, onChange }: Props) {
  const [name, setName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const active = products.filter((p) => !p.archived);
  const archived = products.filter((p) => p.archived);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Two products with the same name are indistinguishable in the picker and
    // collide into one column in the export, so keep the names unique.
    if (products.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Already on the list', `You already have a product called "${trimmed}".`);
      return;
    }
    onChange([...products, { id: newId(), name: trimmed, archived: false, createdAt: new Date().toISOString() }]);
    setName('');
  };

  const setArchived = (id: string, archived: boolean) =>
    onChange(products.map((p) => (p.id === id ? { ...p, archived } : p)));

  const confirmArchive = (p: Product) =>
    Alert.alert(`Remove ${p.name}?`, 'It disappears from the daily picker but stays in the days you already logged.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setArchived(p.id, true) },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Everything you put on your face: cleansers, serums, moisturisers, sunscreen, makeup. Each one becomes a chip on the
          Today screen.
        </Text>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Product name"
            placeholderTextColor={colors.inkSoft}
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
          <Text style={styles.empty}>No products yet. Add the ones you're using now.</Text>
        ) : (
          active.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.name}>{p.name}</Text>
              <Pressable accessibilityRole="button" onPress={() => confirmArchive(p)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}

        {archived.length > 0 ? (
          <View style={styles.archivedWrap}>
            <Pressable onPress={() => setShowArchived((s) => !s)} style={styles.archivedToggle}>
              <Text style={styles.archivedTitle}>
                {showArchived ? 'Hide' : 'Show'} removed products ({archived.length})
              </Text>
            </Pressable>
            {showArchived
              ? archived.map((p) => (
                  <View key={p.id} style={styles.row}>
                    <Text style={[styles.name, styles.nameArchived]}>{p.name}</Text>
                    <Pressable accessibilityRole="button" onPress={() => setArchived(p.id, false)} hitSlop={8}>
                      <Text style={styles.restore}>Restore</Text>
                    </Pressable>
                  </View>
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingBottom: 48 },
  intro: { fontSize: 15, color: colors.inkSoft, lineHeight: 22, marginBottom: space.lg },
  addRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.moss,
    borderRadius: radius.control,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  empty: { fontSize: 15, color: colors.inkSoft },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  name: { fontSize: 16, color: colors.ink, flex: 1, marginRight: space.md },
  nameArchived: { color: colors.inkSoft },
  remove: { fontSize: 15, color: colors.flare },
  restore: { fontSize: 15, color: colors.moss },
  archivedWrap: { marginTop: space.lg },
  archivedToggle: { paddingVertical: space.sm, marginBottom: space.sm },
  archivedTitle: { fontSize: 15, color: colors.inkSoft },
});
