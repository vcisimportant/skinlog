import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, space, usePalette } from '../theme';

type Props = {
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (v: number | null) => void;
};

export function Scale({ label, low, high, value, onChange }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${n} of 5`}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : n)}
              style={[
                styles.dot,
                { borderColor: c.scale[n - 1] },
                selected && { backgroundColor: c.scale[n - 1] },
              ]}
            >
              <Text style={[styles.dotText, selected && styles.dotTextSelected]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>{low}</Text>
        <Text style={styles.end}>{high}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { marginBottom: space.lg },
    label: { fontSize: 17, fontWeight: '600', color: c.ink, marginBottom: space.md },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    dot: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    dotText: { fontSize: 18, fontWeight: '600', color: c.inkSoft },
    dotTextSelected: { color: c.onAccent },
    ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
    end: { fontSize: 13, color: c.inkSoft },
  });
