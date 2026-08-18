import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import TwoRowSlider, { SliderCard } from './TwoRowSlider';
import { OwnerKind, OWNER_LABEL, UnifiedBooking } from '../data/bookingViews';
import { colors, radius, typography } from '../theme/theme';

/**
 * A dashboard shelf of bookings — Upcoming, In progress — with the same view
 * switcher the recommendation shelves use, so every shelf on the dashboard
 * behaves identically.
 *
 * Sliding is the default because it holds the whole list in two lines; list,
 * grid and table are for comparing rather than glancing, and cap themselves so
 * one shelf can't push the rest of the page off screen.
 */

type Mode = 'slide' | 'list' | 'grid' | 'table';

const MODES: { key: Mode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'slide', icon: 'albums-outline', label: 'Sliding view' },
  { key: 'list', icon: 'reorder-four-outline', label: 'List view' },
  { key: 'grid', icon: 'grid-outline', label: 'Grid view' },
  { key: 'table', icon: 'list-outline', label: 'Table view' },
];

const OWNER_ICON: Record<OwnerKind, keyof typeof Ionicons.glyphMap> = {
  self: 'person-outline',
  minor: 'happy-outline',
  family: 'people-outline',
};

/** A static view shows this many before deferring to the full list. */
const STATIC_CAP = 4;

type Props = {
  title: string;
  subtitle?: string;
  items: UnifiedBooking[];
  emptyText: string;
  onSeeAll: () => void;
  onItemPress: (item: UnifiedBooking) => void;
  initialMode?: Mode;
  /** Per-member totals shown under the heading. */
  breakdown?: { kind: OwnerKind; count: number }[];
  /** Seconds between auto-advances while sliding. */
  intervalSec?: number;
};

const toCard = (r: UnifiedBooking): SliderCard => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  meta: r.meta,
  // Whose booking it is matters more on a shared dashboard than what type it
  // is, so that takes the badge when it isn't your own.
  badge: r.ownerKind === 'self' ? r.kindLabel : `For ${r.ownerName}`,
  icon: r.icon,
  tint: r.tint,
});

export default function BookingStrip({
  title, subtitle, items, emptyText, onSeeAll, onItemPress,
  initialMode = 'slide', breakdown = [], intervalSec = 22,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const shown = mode === 'slide' ? items : items.slice(0, STATIC_CAP);
  const hidden = items.length - shown.length;

  const ownerLine = (r: UnifiedBooking) => (
    r.ownerKind === 'self' ? null : (
      <View style={styles.ownerLine}>
        <Ionicons name={OWNER_ICON[r.ownerKind]} size={11} color={colors.textMuted} />
        <Text style={styles.ownerLineText} numberOfLines={1}>For {r.ownerName}</Text>
      </View>
    )
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={typography.h2}>{title}</Text>
            <View style={styles.countChip}><Text style={styles.countText}>{items.length}</Text></View>
          </View>
          {subtitle ? <Text style={typography.bodyMuted}>{subtitle}</Text> : null}
          {/* The total is the household's, so say whose it is made of. */}
          {breakdown.length ? (
            <View style={styles.breakdownRow}>
              {breakdown.map((b) => (
                <View key={b.kind} style={styles.ownerChip}>
                  <Ionicons name={OWNER_ICON[b.kind]} size={11} color={colors.textSecondary} />
                  <Text style={styles.ownerChipText}>{OWNER_LABEL[b.kind]} {b.count}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {items.length ? (
        <>
          <View style={styles.toggleRow}>
            <View style={styles.toggle}>
              {MODES.map((m) => {
                const active = mode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                    accessibilityLabel={m.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={m.icon} size={14} color={active ? colors.white : colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {mode === 'slide' ? (
              <View style={styles.hint}>
                <Ionicons name="swap-horizontal-outline" size={12} color={colors.textMuted} />
                <Text style={styles.hintText}>Swipe · auto every {intervalSec}s</Text>
              </View>
            ) : (
              <Text style={styles.hintText}>{shown.length} of {items.length}</Text>
            )}
          </View>

          {/* ── Sliding ───────────────────────────────────────────── */}
          {mode === 'slide' ? (
            <TwoRowSlider
              items={items.map(toCard)}
              intervalSec={intervalSec}
              onPress={(id) => {
                const item = items.find((x) => x.id === id);
                if (item) onItemPress(item);
              }}
            />
          ) : null}

          {/* ── List ──────────────────────────────────────────────── */}
          {mode === 'list' ? shown.map((r) => (
            <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => onItemPress(r)}>
              <Card style={styles.listRow}>
                <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
                  <Ionicons name={r.icon} size={18} color={r.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3} numberOfLines={2}>{r.title}</Text>
                  <Text style={typography.bodyMuted} numberOfLines={1}>{r.subtitle}</Text>
                  <Text style={typography.caption} numberOfLines={1}>{r.meta}</Text>
                  {ownerLine(r)}
                </View>
                <View style={styles.listRight}>
                  <Badge label={r.kindLabel} tone="neutral" />
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          )) : null}

          {/* ── Grid ──────────────────────────────────────────────── */}
          {mode === 'grid' ? (
            <View style={styles.grid}>
              {shown.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.gridCard}
                  activeOpacity={0.85}
                  onPress={() => onItemPress(r)}
                >
                  <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
                    <Ionicons name={r.icon} size={18} color={r.tint} />
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={3}>{r.title}</Text>
                  <Text style={typography.caption} numberOfLines={1}>{r.subtitle}</Text>
                  {ownerLine(r)}
                  <Text style={[styles.gridKind, { color: r.tint }]} numberOfLines={1}>{r.kindLabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* ── Table ─────────────────────────────────────────────── */}
          {mode === 'table' ? (
            <Card style={styles.tableCard}>
              <View style={styles.thead}>
                <Text style={[styles.th, styles.colName]}>Booking</Text>
                <Text style={[styles.th, styles.colKind]}>Type</Text>
              </View>
              {shown.map((r) => (
                <TouchableOpacity key={r.id} style={styles.tr} onPress={() => onItemPress(r)} activeOpacity={0.7}>
                  <Ionicons name={r.icon} size={15} color={r.tint} />
                  <View style={styles.colName}>
                    <Text style={styles.tdStrong} numberOfLines={1}>{r.title}</Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {r.ownerKind === 'self' ? r.meta : `${r.ownerName} · ${r.meta}`}
                    </Text>
                  </View>
                  <Text style={[styles.td, styles.colKind]} numberOfLines={2}>{r.kindLabel}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          ) : null}

          {/* A capped view must say what it's hiding, or it reads as the whole
              shelf. */}
          {mode !== 'slide' && hidden > 0 ? (
            <TouchableOpacity style={styles.moreRow} onPress={onSeeAll}>
              <Text style={styles.moreText}>View all {items.length}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <Card><Text style={typography.bodyMuted}>{emptyText}</Text></Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countChip: {
    minWidth: 22, paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 11, backgroundColor: colors.background, alignItems: 'center',
  },
  countText: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  ownerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: colors.background,
  },
  ownerChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 3 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 3, gap: 2,
  },
  toggleBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.sm - 2 },
  toggleBtnActive: { backgroundColor: colors.primary },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },

  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ownerLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ownerLineText: { fontSize: 11, fontWeight: '600', color: colors.textMuted, flexShrink: 1 },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  listRight: { alignItems: 'flex-end', gap: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '47.5%', gap: 4, padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  gridTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, marginTop: 4, lineHeight: 17 },
  gridKind: { fontSize: 11, fontWeight: '700', marginTop: 3 },

  tableCard: { padding: 0, overflow: 'hidden' },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.background,
  },
  th: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  td: { fontSize: 12, color: colors.textSecondary },
  tdStrong: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  tdSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  colName: { flex: 2.4 },
  colKind: { flex: 1 },

  moreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.background,
  },
  moreText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
