import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';

type Props = {
  label: string;
  value: number | null;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
};

export function Stepper({ label, value, unit, step, min, max, onChange }: Props) {
  const v = value ?? 0;
  const bump = (d: number) => {
    const next = Math.min(max, Math.max(min, +(v + d).toFixed(1)));
    onChange(next);
  };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={() => bump(-step)} style={styles.btn}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Pressable onPress={() => onChange(null)} style={styles.valueWrap}>
          <Text style={[styles.value, value === null && styles.valueEmpty]}>
            {value === null ? 'skip' : `${value} ${unit}`}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => bump(step)} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  label: { fontSize: 17, fontWeight: '600', color: colors.ink },
  controls: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.mossSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 22, color: colors.moss, lineHeight: 26 },
  valueWrap: { minWidth: 76, alignItems: 'center' },
  value: { fontSize: 16, color: colors.ink },
  valueEmpty: { color: colors.inkSoft },
});
