import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TrackedList } from '../components/TrackedList';
import { Settings } from '../storage';
import { Palette, radius, space, usePalette } from '../theme';
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

  const time = useMemo(() => {
    const d = new Date();
    d.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);
    return d;
  }, [settings.reminderHour, settings.reminderMinute]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Daily reminder</Text>
          <Text style={styles.intro}>
            A diary only works if it gets written. One notification a day, at a time that suits you.
          </Text>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Remind me</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(reminderEnabled) => onChangeSettings({ ...settings, reminderEnabled })}
              trackColor={{ false: c.line, true: c.moss }}
            />
          </View>
          {settings.reminderEnabled ? (
            <View style={styles.reminderRow}>
              <Text style={styles.reminderLabel}>At</Text>
              <DateTimePicker
                value={time}
                mode="time"
                display="compact"
                onChange={(_, picked) =>
                  picked &&
                  onChangeSettings({
                    ...settings,
                    reminderHour: picked.getHours(),
                    reminderMinute: picked.getMinutes(),
                  })
                }
              />
            </View>
          ) : null}
        </View>

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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: space.lg, paddingBottom: 48 },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: space.md,
      marginBottom: space.xl,
    },
    title: { fontSize: 20, fontWeight: '700', color: c.ink, marginBottom: space.xs },
    intro: { fontSize: 15, color: c.inkSoft, lineHeight: 22, marginBottom: space.md },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    reminderLabel: { fontSize: 17, fontWeight: '600', color: c.ink },
  });
