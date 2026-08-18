import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import TwoRowSlider, { SliderCard } from './TwoRowSlider';
import { useCentringRail } from './centringRail';
import { inr, PRODUCT_LABEL } from '../data/checkout';
import { RecoItem, Shelf } from '../data/recommendations';
import { colors, radius, typography } from '../theme/theme';

/**
 * One recommendation shelf: a heading, a view switcher, and a way into the
 * full list. Used on the dashboard and again on the Discover page, so the two
 * can't drift apart.
 *
 * Sliding is the default because it fits eight products into two lines, but
 * anyone comparing rather than browsing can switch to a list, a grid or a
 * table — the same choice the booking strips offer.
 */

type Mode = 'slide' | 'list' | 'grid' | 'table';

const MODES: { key: Mode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'slide', icon: 'albums-outline', label: 'Sliding view' },
  { key: 'list', icon: 'reorder-four-outline', label: 'List view' },
  { key: 'grid', icon: 'grid-outline', label: 'Grid view' },
  { key: 'table', icon: 'list-outline', label: 'Table view' },
];

/** A static view shows this many before deferring to the full list. */
const STATIC_CAP = 4;

export const toCard = (r: RecoItem): SliderCard => ({
  id: r.id,
  title: r.name,
  subtitle: r.provider,
  meta: `${r.price === 0 ? 'Free' : inr(r.price)} · ${r.meta}`,
  badge: r.reason,
  icon: r.icon,
  tint: r.tint,
});

/** Every shelf row is a product, so tapping one lands in the same checkout. */
export function openReco(router: ReturnType<typeof useRouter>, r: RecoItem) {
  if (r.kind === 'appointment') {
    router.push('/booking/d1');
    return;
  }
  router.push({
    pathname: '/checkout',
    params: {
      kind: r.kind,
      name: r.name,
      price: String(r.price),
      provider: r.provider,
      meta: r.meta,
    },
  } as never);
}

/** The heads a grouped shelf splits into. */
const GROUP_HEADS = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Individual services' },
  { key: 'team', label: 'Team services' },
] as const;
type GroupKey = typeof GROUP_HEADS[number]['key'];

export default function RecoShelf({
  shelf, showViewAll = true,
}: { shelf: Shelf; showViewAll?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('slide');
  const [group, setGroup] = useState<GroupKey>('all');
  const rail = useCentringRail();
  useEffect(() => {
    const t = setTimeout(() => rail.centre(group), 80);
    return () => clearTimeout(t);
  }, [group, rail.sidePad]);

  // The family-doctor shelf tags each product solo or team, and the split
  // matters because they book differently: solo work goes to the doctor's own
  // slot flow, team plans go to a team's records-and-pay. Shelves without
  // tags render exactly as before.
  const grouped = shelf.items.some((r) => r.group);
  const items = grouped && group !== 'all'
    ? shelf.items.filter((r) => r.group === group)
    : shelf.items;

  const open = (r: RecoItem) => openReco(router, r);
  const seeAll = () => router.push(`/discover/${shelf.key}`);
  const shown = mode === 'slide' ? items : items.slice(0, STATIC_CAP);
  const hidden = items.length - shown.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: `${shelf.tint}1A` }]}>
          <Ionicons name={shelf.icon} size={16} color={shelf.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2} numberOfLines={2}>{shelf.title}</Text>
          <Text style={typography.bodyMuted} numberOfLines={2}>{shelf.subtitle}</Text>
        </View>
        {showViewAll ? (
          <TouchableOpacity style={styles.viewAll} hitSlop={8} onPress={seeAll}>
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

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
        {grouped ? (
        <ScrollView
          ref={rail.ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={shelfHeadStyles.rail}
          contentContainerStyle={[shelfHeadStyles.railContent, { paddingHorizontal: rail.sidePad }]}
          onLayout={rail.onRailLayout}
        >
          {GROUP_HEADS.map((h) => {
            const on = group === h.key;
            const count = h.key === 'all'
              ? shelf.items.length
              : shelf.items.filter((r) => r.group === h.key).length;
            return (
              <TouchableOpacity
                key={h.key}
                onLayout={(e) => { rail.onChipLayout(h.key)(e); if (on) rail.centre(h.key); }}
                style={[shelfHeadStyles.chip, on && shelfHeadStyles.chipOn]}
                onPress={() => setGroup(h.key)}
              >
                <Text style={[shelfHeadStyles.text, on && shelfHeadStyles.textOn]}>
                  {h.label}
                </Text>
                <Text style={[shelfHeadStyles.count, on && shelfHeadStyles.textOn]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {mode === 'slide' ? (
          <View style={styles.hint}>
            <Ionicons name="swap-horizontal-outline" size={12} color={colors.textMuted} />
            <Text style={styles.hintText}>Swipe · auto every {shelf.intervalSec}s</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>
            {shown.length} of {shelf.items.length}
          </Text>
        )}
      </View>

      {/* ── Sliding: the two-row shelf ───────────────────────────── */}
      {mode === 'slide' ? (
        <TwoRowSlider
          items={shelf.items.map(toCard)}
          intervalSec={shelf.intervalSec}
          onPress={(id) => {
            const item = shelf.items.find((x) => x.id === id);
            if (item) open(item);
          }}
        />
      ) : null}

      {/* ── List: full-width rows ────────────────────────────────── */}
      {mode === 'list' ? shown.map((r) => (
        <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => open(r)}>
          <Card style={styles.listRow}>
            <View style={[styles.rowIcon, { backgroundColor: `${r.tint}1A` }]}>
              <Ionicons name={r.icon} size={18} color={r.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3} numberOfLines={2}>{r.name}</Text>
              <Text style={typography.bodyMuted} numberOfLines={1}>{r.provider}</Text>
              <View style={styles.reasonRow}>
                <Ionicons name="sparkles-outline" size={10} color={r.tint} />
                <Text style={[styles.reason, { color: r.tint }]} numberOfLines={1}>{r.reason}</Text>
              </View>
            </View>
            <Text style={styles.price}>{r.price === 0 ? 'Free' : inr(r.price)}</Text>
          </Card>
        </TouchableOpacity>
      )) : null}

      {/* ── Grid: two up ─────────────────────────────────────────── */}
      {mode === 'grid' ? (
        <View style={styles.grid}>
          {shown.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => open(r)}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${r.tint}1A` }]}>
                <Ionicons name={r.icon} size={18} color={r.tint} />
              </View>
              <Text style={styles.gridTitle} numberOfLines={3}>{r.name}</Text>
              <Text style={typography.caption} numberOfLines={1}>{r.provider}</Text>
              <Text style={[styles.price, { color: r.tint }]}>
                {r.price === 0 ? 'Free' : inr(r.price)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* ── Table: compact columns ───────────────────────────────── */}
      {mode === 'table' ? (
        <Card style={styles.tableCard}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colName]}>Product</Text>
            <Text style={[styles.th, styles.colKind]}>Type</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
          </View>
          {shown.map((r) => (
            <TouchableOpacity key={r.id} style={styles.tr} onPress={() => open(r)} activeOpacity={0.7}>
              <Ionicons name={r.icon} size={14} color={r.tint} />
              <View style={styles.colName}>
                <Text style={styles.tdStrong} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.tdSub} numberOfLines={1}>{r.provider}</Text>
              </View>
              <Text style={[styles.td, styles.colKind]} numberOfLines={2}>{PRODUCT_LABEL[r.kind]}</Text>
              <Text style={[styles.tdStrong, styles.colPrice]} numberOfLines={1}>
                {r.price === 0 ? 'Free' : inr(r.price)}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}

      {/* A capped static view must say what it's hiding, or it reads as the
          whole shelf. */}
      {mode !== 'slide' && hidden > 0 ? (
        <TouchableOpacity style={styles.moreRow} onPress={seeAll}>
          <Text style={styles.moreText}>View all {shelf.items.length}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 3 },
  viewAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 3, gap: 2,
  },
  toggleBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.sm - 2 },
  toggleBtnActive: { backgroundColor: colors.primary },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reason: { fontSize: 10.5, fontWeight: '700', flexShrink: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '47.5%', gap: 4, padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  gridTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, marginTop: 4, lineHeight: 17 },

  tableCard: { padding: 0, overflow: 'hidden' },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.background,
  },
  th: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  td: { fontSize: 11.5, color: colors.textSecondary },
  tdStrong: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  tdSub: { fontSize: 10.5, color: colors.textMuted, marginTop: 1 },
  colName: { flex: 2.3 },
  colKind: { flex: 1.1 },
  colPrice: { width: 62, textAlign: 'right' },

  moreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.background,
  },
  moreText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});


const shelfHeadStyles = StyleSheet.create({
  rail: { flexGrow: 0, marginBottom: 10 },
  railContent: { gap: 7, paddingRight: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  textOn: { color: colors.white },
  count: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
});
