import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Settings } from '../storage';
import { Palette, radius, space, usePalette } from '../theme';

type Props = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

export function ReminderCard({ settings, onChange }: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);

  const time = useMemo(() => {
    const d = new Date();
    d.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);
    return d;
  }, [settings.reminderHour, settings.reminderMinute]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily reminder</Text>
      <Text style={styles.intro}>
        A diary only works if it gets written. One notification a day, at a time that suits you.
      </Text>
      <View style={styles.row}>
        <Text style={styles.label}>Remind me</Text>
        <Switch
          value={settings.reminderEnabled}
          onValueChange={(reminderEnabled) => onChange({ ...settings, reminderEnabled })}
          trackColor={{ false: c.line, true: c.moss }}
        />
      </View>
      {settings.reminderEnabled ? (
        <View style={styles.row}>
          <Text style={styles.label}>At</Text>
          <DateTimePicker
            value={time}
            mode="time"
            display="compact"
            onChange={(_, picked) =>
              picked && onChange({ ...settings, reminderHour: picked.getHours(), reminderMinute: picked.getMinutes() })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: radius.card, padding: space.md, marginBottom: space.xl },
    title: { fontSize: 20, fontWeight: '700', color: c.ink, marginBottom: space.xs },
    intro: { fontSize: 15, color: c.inkSoft, lineHeight: 22, marginBottom: space.md },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
    label: { fontSize: 17, fontWeight: '600', color: c.ink },
  });
