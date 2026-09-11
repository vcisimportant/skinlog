import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Backup, buildBackup, parseBackup } from '../backup';
import { backupStatus } from '../backupHealth';
import { buildCsv } from '../csv';
import { todayKey } from '../dates';
import { confirm, notify } from '../dialog';
import { pickTextFile, shareText } from '../files';
import { analysisPrompt } from '../prompt';
import { Palette, radius, space, usePalette } from '../theme';
import { Settings } from '../storage';
import { Entry, Factor, Product } from '../types';

type Props = {
  entries: Record<string, Entry>;
  products: Product[];
  factors: Factor[];
  settings: Settings;
  storagePersistent: boolean | null;
  onClear: () => void;
  onRestore: (backup: Backup) => Promise<void>;
  onChangeSettings: (settings: Settings) => void;
};

const reason = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export function ExportScreen({
  entries,
  products,
  factors,
  settings,
  storagePersistent,
  onClear,
  onRestore,
  onChangeSettings,
}: Props) {
  const c = usePalette();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [status, setStatus] = useState<string | null>(null);
  const count = Object.keys(entries).length;
  const csv = useMemo(() => buildCsv(entries, products, factors), [entries, products, factors]);
  const warning = backupStatus({
    days: count,
    lastBackupAt: settings.lastBackupAt,
    lastBackupDays: settings.lastBackupDays,
    today: todayKey(),
  });

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // The question goes with the data, so pasting it somewhere is one step and asks
  // for lagged correlations rather than same-day ones.
  const copy = async () => {
    await Clipboard.setStringAsync(analysisPrompt(count) + csv);
    flash('Copied, with the question already written. Paste it into a chat.');
  };

  const saveCsv = async () => {
    try {
      await shareText(`skinlog-${todayKey()}.csv`, csv, 'text/csv', 'public.comma-separated-values-text');
    } catch (e) {
      flash(reason(e));
    }
  };

  const saveBackup = async () => {
    try {
      const json = JSON.stringify(buildBackup(entries, products, factors), null, 2);
      await shareText(`skinlog-backup-${todayKey()}.json`, json, 'application/json', 'public.json');
      onChangeSettings({ ...settings, lastBackupAt: new Date().toISOString(), lastBackupDays: count });
    } catch (e) {
      flash(reason(e));
    }
  };

  const restore = async () => {
    let backup: Backup;
    try {
      const raw = await pickTextFile();
      if (raw === null) return;
      backup = parseBackup(raw);
    } catch (e) {
      notify('Could not restore', reason(e));
      return;
    }
    const days = Object.keys(backup.entries).length;
    const ok = await confirm({
      title: 'Restore this backup?',
      message: `The file holds ${days} ${days === 1 ? 'day' : 'days'}. Restoring replaces everything currently on this phone.`,
      confirmLabel: 'Restore',
      destructive: true,
    });
    if (!ok) return;
    try {
      await onRestore(backup);
      flash(`Restored ${days} ${days === 1 ? 'day' : 'days'}.`);
    } catch (e) {
      notify('Could not restore', reason(e));
    }
  };

  const confirmClear = async () => {
    const ok = await confirm({
      title: 'Delete all entries?',
      message: 'This removes every logged day from this phone. Save a backup first if you want to keep them.',
      confirmLabel: 'Delete all',
      destructive: true,
    });
    if (ok) onClear();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.countLabel}>{count === 1 ? 'day logged' : 'days logged'}</Text>

      <Text style={styles.body}>
        One row per day. Copying puts a written question above the data, so whoever reads it knows the scales run 1
        (best) to 5 (worst) and looks for delayed effects rather than same-day ones.
      </Text>

      <Pressable accessibilityRole="button" onPress={copy} disabled={count === 0} style={[styles.primary, count === 0 && styles.disabled]}>
        <Text style={styles.primaryText}>Copy for analysis</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={saveCsv} disabled={count === 0} style={[styles.secondary, count === 0 && styles.disabled]}>
        <Text style={styles.secondaryText}>Save the CSV as a file</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.previewWrap}>
        <Text style={styles.previewLabel}>Preview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.preview}>{count === 0 ? 'No data yet.' : csv.split('\n').slice(0, 6).join('\n')}</Text>
        </ScrollView>
      </View>

      <Text style={styles.heading}>Backup</Text>
      <Text style={styles.body}>
        Your diary lives only on this phone. A backup is a single file you can keep in Files, Drive or your email, and
        restore onto a new phone. The CSV is for analysis; the backup is what brings your data back.
      </Text>
      {warning ? (
        <View style={[styles.warn, warning.level === 'shrunk' && styles.warnLoud]}>
          <Text style={[styles.warnText, warning.level === 'shrunk' && styles.warnTextLoud]}>{warning.message}</Text>
        </View>
      ) : null}
      {storagePersistent === false ? (
        <Text style={styles.note}>
          This browser has not granted protected storage yet. Adding Skinlog to your Home Screen and opening it
          regularly usually earns it — until then, back up more often.
        </Text>
      ) : null}
      <Pressable accessibilityRole="button" onPress={saveBackup} disabled={count === 0} style={[styles.secondary, count === 0 && styles.disabled]}>
        <Text style={styles.secondaryText}>Save a backup file</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={restore} style={styles.secondary}>
        <Text style={styles.secondaryText}>Restore from a backup</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={confirmClear} style={styles.danger}>
        <Text style={styles.dangerText}>Delete all entries</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: space.lg, paddingBottom: 48 },
    count: { fontSize: 64, fontWeight: '700', color: c.ink, letterSpacing: -2, lineHeight: 70 },
    countLabel: { fontSize: 17, color: c.inkSoft, marginBottom: space.lg },
    heading: { fontSize: 20, fontWeight: '700', color: c.ink, marginTop: space.xl, marginBottom: space.sm },
    body: { fontSize: 15, color: c.ink, lineHeight: 22, marginBottom: space.lg },
    primary: { backgroundColor: c.moss, borderRadius: radius.card, paddingVertical: 16, alignItems: 'center' },
    primaryText: { color: c.onAccent, fontSize: 17, fontWeight: '600' },
    secondary: {
      marginTop: space.sm,
      borderRadius: radius.card,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.moss,
    },
    secondaryText: { color: c.moss, fontSize: 17, fontWeight: '600' },
    disabled: { opacity: 0.4 },
    warn: {
      backgroundColor: c.mossSoft,
      borderRadius: radius.card,
      padding: space.md,
      marginBottom: space.sm,
    },
    warnLoud: { backgroundColor: c.flareSoft },
    warnText: { fontSize: 14, color: c.ink, lineHeight: 20 },
    warnTextLoud: { color: c.flare, fontWeight: '600' },
    note: { fontSize: 13, color: c.inkSoft, lineHeight: 19, marginBottom: space.sm },
    status: { marginTop: space.md, color: c.moss, fontSize: 15, textAlign: 'center' },
    previewWrap: { marginTop: space.xl, backgroundColor: c.surface, borderRadius: radius.card, padding: space.md },
    previewLabel: { fontSize: 13, color: c.inkSoft, marginBottom: space.sm },
    preview: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12, color: c.ink, lineHeight: 18 },
    danger: { marginTop: space.xl, alignItems: 'center', paddingVertical: 12 },
    dangerText: { color: c.flare, fontSize: 15 },
  });
