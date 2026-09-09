import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, radius, space, usePalette } from '../theme';

type Props = {
  label: string;
  value: number | null;
  unit: string;
  step: number;
  min: number;
  max: number;
  start: number; // where the first tap lands, so a normal value is one press away
  onChange: (v: number | null) => void;
};

export function Stepper({ label, value, unit, step, min, max, start, onChange }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);

  // Stepping up from nothing used to start at zero, which put a normal night's
  // sleep fourteen taps away.
  const bump = (d: number) =>
    onChange(value === null ? start : Math.min(max, Math.max(min, +(value + d).toFixed(1))));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Less ${label}`} onPress={() => bump(-step)} style={styles.btn}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={value === null ? `${label} skipped` : `${label} ${value} ${unit}, tap to skip`}
          onPress={() => onChange(null)}
          style={styles.valueWrap}
        >
          <Text style={[styles.value, value === null && styles.valueEmpty]}>
            {value === null ? 'skip' : `${value} ${unit}`}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`More ${label}`} onPress={() => bump(step)} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
    label: { fontSize: 17, fontWeight: '600', color: c.ink },
    controls: { flexDirection: 'row', alignItems: 'center' },
    btn: {
      width: 40,
      height: 40,
      borderRadius: radius.control,
      backgroundColor: c.mossSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { fontSize: 22, color: c.moss, lineHeight: 26 },
    valueWrap: { minWidth: 76, alignItems: 'center' },
    value: { fontSize: 16, color: c.ink },
    valueEmpty: { color: c.inkSoft },
  });
