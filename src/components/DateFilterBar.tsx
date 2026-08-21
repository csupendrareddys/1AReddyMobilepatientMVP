import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import {
  DatePeriod, DateRange, emptyRange, hasRange, PERIODS, RANGE_PRESETS,
  rangeLabel, TODAY,
} from '../data/dateFilter';
import { colors, radius, typography } from '../theme/theme';

/**
 * The date controls above a list of prescriptions or documents.
 *
 * Two controls, because there are two ways a patient looks for an old record.
 * Usually they only know it's old — that's the period rail, recent against
 * more than three months. Sometimes they know roughly when — that's the date
 * range underneath, with presets so the common spans need no typing.
 *
 * The rail carries its counts so an empty head is obvious before it's tapped.
 */
export default function DateFilterBar({
  period, onPeriod, range, onRange, counts,
}: {
  period: DatePeriod;
  onPeriod: (p: DatePeriod) => void;
  range: DateRange;
  onRange: (r: DateRange) => void;
  counts: Record<DatePeriod, number>;
}) {
  /*
   * No centring rail here, deliberately.
   *
   * The shared `useCentringRail` positions the chosen chip from measurements
   * taken in `onLayout` — and no `onLayout` in this subtree fires on web, so
   * the rail width stayed zero, the end spacers collapsed, and tapping the
   * last head scrolled it off the screen rather than into the middle. Three
   * short heads fit an iPhone-width rail outright, which beats centring: no
   * measurement, no scroll, and every head visible from the start. It still
   * scrolls if the screen is narrower or the text scaled up.
   */
  const [open, setOpen] = useState(false);
  // Edited in the sheet and only committed on Apply, so a half-typed date
  // never blanks the list underneath.
  const [draft, setDraft] = useState<DateRange>(range);

  const openSheet = () => { setDraft(range); setOpen(true); };
  const apply = () => { onRange(draft); setOpen(false); };

  return (
    <View style={styles.wrap}>
      {/* ── Date-wise filter ─────────────────────────────────────── */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={openSheet} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.dateBtnText} numberOfLines={1}>{rangeLabel(range)}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.primary} />
        </TouchableOpacity>
        {hasRange(range) ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onRange(emptyRange())}
            accessibilityLabel="Clear the date filter"
          >
            <Ionicons name="close" size={13} color={colors.textMuted} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Recent / older heads ─────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {PERIODS.map((p) => {
          const on = p.key === period;
          const n = counts[p.key];
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, on && styles.chipOn, !n && !on && styles.chipEmpty]}
              activeOpacity={0.85}
              onPress={() => onPeriod(p.key)}
            >
              <Ionicons
                name={p.icon as keyof typeof Ionicons.glyphMap}
                size={13}
                color={on ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {p.label}
              </Text>
              <View style={[styles.count, on && styles.countOn]}>
                <Text style={[styles.countText, on && styles.countTextOn]}>{n}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AppModal visible={open} onClose={() => setOpen(false)} title="Filter by date">
        <Text style={typography.bodyMuted}>
          Pick a span, or type an exact range. Dates are {TODAY.slice(0, 4)}-MM-DD.
        </Text>

        <Text style={[typography.label, styles.sheetLabel]}>QUICK SPANS</Text>
        <View style={styles.presetRow}>
          {RANGE_PRESETS.map((p) => {
            const r = p.range();
            const on = draft.from === r.from && draft.to === r.to;
            return (
              <TouchableOpacity
                key={p.label}
                style={[styles.preset, on && styles.presetOn]}
                onPress={() => setDraft(r)}
              >
                <Text style={[styles.presetText, on && styles.presetTextOn]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[typography.label, styles.sheetLabel]}>EXACT RANGE</Text>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>From</Text>
            <TextInput
              style={styles.input}
              value={draft.from}
              onChangeText={(v) => setDraft((d) => ({ ...d, from: v }))}
              placeholder="2026-01-01"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.caption}>To</Text>
            <TextInput
              style={styles.input}
              value={draft.to}
              onChangeText={(v) => setDraft((d) => ({ ...d, to: v }))}
              placeholder={TODAY}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>
        </View>

        <PrimaryButton label="Apply" style={styles.applyBtn} onPress={apply} />
        <PrimaryButton
          label="Any date"
          variant="outline"
          style={styles.anyBtn}
          onPress={() => { onRange(emptyRange()); setOpen(false); }}
        />
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dateBtnText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: colors.primary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 8 },
  clearText: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },

  rail: { gap: 7, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipEmpty: { opacity: 0.55 },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  count: {
    minWidth: 19, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: radius.pill, backgroundColor: colors.background,
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 10.5, fontWeight: '800', color: colors.textSecondary, textAlign: 'center' },
  countTextOn: { color: colors.white },

  sheetLabel: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  preset: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  presetOn: { backgroundColor: '#E8F1FC', borderColor: colors.primary },
  presetText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  presetTextOn: { color: colors.primary, fontWeight: '800' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 11, paddingVertical: 9, marginTop: 4,
    fontSize: 13, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  applyBtn: { marginTop: 20 },
  anyBtn: { marginTop: 10 },
});
