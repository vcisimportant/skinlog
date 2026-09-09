import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Palette, radius, usePalette } from '../theme';

type Props = {
  label: string;
  steps: [string, string];
  value: 0 | 1 | 2;
  onChange: (v: 0 | 1 | 2) => void;
};

// Tap cycles: none -> some -> a lot -> none.
export function LevelChip({ label, steps, value, onChange }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const next = ((value + 1) % 3) as 0 | 1 | 2;
  const text = value === 0 ? label : `${label}: ${steps[value - 1]}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value === 0 ? 'none' : steps[value - 1]}`}
      onPress={() => onChange(next)}
      style={[styles.chip, value === 1 && styles.some, value === 2 && styles.lot]}
    >
      <Text style={[styles.text, value > 0 && styles.textOn]}>{text}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    some: { backgroundColor: c.amber, borderColor: c.amber },
    lot: { backgroundColor: c.flare, borderColor: c.flare },
    text: { fontSize: 15, color: c.ink },
    textOn: { color: c.onAccent },
  });
