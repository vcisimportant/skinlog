import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { ReminderCard } from '../components/ReminderCard';
import { TrackedList } from '../components/TrackedList';
import { Settings } from '../storage';
import { Palette, space, usePalette } from '../theme';
import { Factor, Product } from '../types';

type Props = {
  products: Product[];
  factors: Factor[];
  settings: Settings;
  onChangeProducts: (products: Product[]) => void;
  onChangeFactors: (factors: Factor[]) => void;
  onChangeSettings: (settings: Settings) => void;
};

export function SetupScreen({
  products,
  factors,
  settings,
  onChangeProducts,
  onChangeFactors,
  onChangeSettings,
}: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ReminderCard settings={settings} onChange={onChangeSettings} />

        <TrackedList
          title="Products"
          intro="Everything you put on your face: cleansers, serums, moisturisers, sunscreen, makeup. Each one becomes a chip on the Today screen."
          placeholder="Product name"
          removeNote="It disappears from the daily picker but stays in the days you already logged."
          items={products}
          onChange={onChangeProducts}
          showAge
        />

        <TrackedList
          title="Things that happened"
          intro="What you want to tick off on a normal day — food, stress, anything you suspect. Keep the list short enough to fill in without thinking."
          placeholder="Dairy, travel, sun…"
          removeNote="It disappears from the daily picker but stays in the days you already logged, and keeps its column in the export."
          items={factors}
          onChange={onChangeFactors}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (_c: Palette) =>
  StyleSheet.create({
    container: { padding: space.lg, paddingBottom: 48 },
  });
