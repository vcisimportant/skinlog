import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  steps: [string, string];
  value: 0 | 1 | 2;
  onChange: (v: 0 | 1 | 2) => void;
};

// Tap cycles: none -> some -> a lot -> none.
export function LevelChip({ label, steps, value, onChange }: Props) {
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

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  some: { backgroundColor: colors.amber, borderColor: colors.amber },
  lot: { backgroundColor: colors.flare, borderColor: colors.flare },
  text: { fontSize: 15, color: colors.ink },
  textOn: { color: '#FFFFFF' },
});
