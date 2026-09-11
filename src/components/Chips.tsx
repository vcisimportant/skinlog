import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, radius, space, usePalette } from '../theme';

// Chips are picked by id, not by their label, so two entries sharing a name still
// toggle independently.
export type ChipOption = { id: string; label: string };

type Props = {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
};

export function Chips({ options, selected, onToggle }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const on = selected.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onToggle(opt.id)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.text, on && styles.textOn]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    chipOn: { backgroundColor: c.mossSoft, borderColor: c.moss },
    text: { fontSize: 15, color: c.inkSoft },
    textOn: { color: c.moss, fontWeight: '600' },
  });
