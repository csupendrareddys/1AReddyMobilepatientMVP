import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { useCentringRail } from '../../src/components/centringRail';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import EmptyState from '../../src/components/EmptyState';
import ViewToggle, { ViewMode } from '../../src/components/ViewToggle';
import { inr, PRODUCT_LABEL } from '../../src/data/checkout';
import { groupOf, RecoItem, shelfByKey } from '../../src/data/recommendations';
import FilterBar from '../../src/components/FilterBar';
import { activeCount, emptyFilters, genderOfName, matchesFilters } from '../../src/data/filters';
import { doctors } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * One shelf, opened out into its full list.
 *
 * The slider shows what fits on screen; this shows everything in it, so a
 * patient who wants to compare rather than browse isn't forced to swipe
 * through a carousel to see the eighth item.
 */
/** Consultation products name their kind; map it for the wizard. */
const consultTypeOf = (r: RecoItem) => {
  const n = r.name.toLowerCase();
  if (n.includes('home')) return 'home_visit';
  if (n.includes('voice') || n.includes('audio')) return 'audio';
  if (n.includes('chat')) return 'chat';
  return 'video';
};

/** A provider's own specialities, for matching products against symptoms. */
const specialityText = (provider: string) => {
  const d = doctors.find((x) => x.full_name === provider.trim());
  return d ? `${d.specializations.join(' ')} ${d.highest_qualification} ${d.bio}` : provider;
};

const GROUP_HEADS = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Individual services' },
  { key: 'team', label: 'Team services' },
] as const;
type GroupKey = typeof GROUP_HEADS[number]['key'];

export default function ShelfScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const shelf = shelfByKey(key ?? '');
  const [mode, setMode] = useState<ViewMode>('table');
  const [group, setGroup] = useState<GroupKey>('all');
  const [filters, setFilters] = useState(emptyFilters());
  const rail = useCentringRail();
  // Centre once the re-render the selection triggered has settled.
  useEffect(() => {
    const t = setTimeout(() => rail.centre(group), 80);
    return () => clearTimeout(t);
  }, [group, rail.sidePad]);
  const [sel, setSel] = useState<string | null>(null);

  /**
   * Tapping a product selects it; the selected card grows a Proceed that says
   * what happens next, because the two kinds book differently — a consultation
   * goes to date & time, a plan-typed product goes straight to Records.
   */
  const proceed = (r: RecoItem) => {
    if (r.kind === 'appointment') {
      router.push({
        pathname: '/booking/[doctorId]',
        params: { doctorId: 'd1', start: 'slot', type: consultTypeOf(r) },
      } as never);
      return;
    }
    router.push({
      pathname: '/checkout',
      params: {
        kind: r.kind, name: r.name, price: String(r.price),
        provider: r.provider, meta: r.meta, start: 'records',
      },
    } as never);
  };

  if (!shelf) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title="Not found" fallback="/discover" />
        <EmptyState icon="help-circle-outline" title="Shelf not found" />
      </ScreenWrapper>
    );
  }

  const items = (group === 'all' ? shelf.items : shelf.items.filter((r) => groupOf(r) === group))
    // The provider is a doctor on some rows and an organisation on others, so
    // the gender filter bites only where a doctor's gender is known.
    .filter((r) => matchesFilters(
      // The provider's specialities count as part of what a product is about:
      // "Chronic Care Follow-up" says nothing about diabetes, but the doctor
      // who delivers it is a diabetes specialist, and that's what the patient
      // filtering for "sugar" is actually looking for.
      [r.name, r.provider, r.meta, r.reason, specialityText(r.provider)].join(' '),
      genderOfName(r.provider),
      filters,
    ));

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader
        title={shelf.title}
        fallback="/discover"
        right={<ViewToggle mode={mode} onChange={setMode} />}
      />

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: `${shelf.tint}1A` }]}>
          <Ionicons name={shelf.icon} size={20} color={shelf.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.body}>{shelf.subtitle}</Text>
          <Text style={typography.caption}>{shelf.items.length} options</Text>
        </View>
      </View>

      {/* Every see-all page here is a short, already-curated list, so filters
          are dropdown boxes throughout — four icon tables would push the
          products they filter off the screen. The family doctor's own list
          goes further: their specialisation, gender and location are fixed, so
          filtering by any of them is a no-op. */}
      <FilterBar
        value={filters}
        onChange={setFilters}
        resultCount={items.length}
        dropdownGroups={['symptoms', 'specializations', 'genders', 'organs', 'locations']}
        // Clinical specialisation is a filter-page table, not an inline control.
        hideGroups={shelf.key === 'family-doctor'
          ? ['specializations', 'genders', 'locations', 'clinical']
          : ['clinical']}
      />

      {/* Solo or team is a real booking difference, so the list splits on it. */}
      <ScrollView
        ref={rail.ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.headRailScroll}
        contentContainerStyle={[styles.headRail, { paddingHorizontal: rail.sidePad }]}
        onLayout={rail.onRailLayout}
      >
        {GROUP_HEADS.map((h) => {
          const on = group === h.key;
          const count = h.key === 'all'
            ? shelf.items.length
            : shelf.items.filter((r) => groupOf(r) === h.key).length;
          return (
            <TouchableOpacity
              key={h.key}
              onLayout={(e) => {
                rail.onChipLayout(h.key)(e);
                // "All" opens centred, so both other heads are in view.
                if (on) rail.centre(h.key);
              }}
              style={[styles.headChip, on && styles.headChipOn]}
              onPress={() => { setGroup(h.key); setSel(null); }}
            >
              <Text style={[styles.headText, on && styles.headTextOn]}>{h.label}</Text>
              <Text style={[styles.headCount, on && styles.headTextOn]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {mode === 'grid' ? (
        <View style={styles.grid}>
          {items.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.gridCard, sel === r.id && styles.rowOn]}
              activeOpacity={0.85}
              onPress={() => setSel(sel === r.id ? null : r.id)}
            >
              <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
                <Ionicons name={r.icon} size={19} color={r.tint} />
              </View>
              <Text style={styles.gridTitle} numberOfLines={3}>{r.name}</Text>
              <Text style={typography.caption} numberOfLines={1}>{r.provider}</Text>
              <Text style={[styles.price, { color: r.tint }]}>
                {r.price === 0 ? 'Free' : inr(r.price)}
              </Text>
              {sel === r.id ? (
                <TouchableOpacity style={styles.proceedBtn} activeOpacity={0.85} onPress={() => proceed(r)}>
                  <Text style={styles.proceedText} numberOfLines={1}>
                    {r.kind === 'appointment' ? 'Date & time' : 'Records & pay'}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.white} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : !items.length ? (
        <Card style={styles.row}>
          <Ionicons name="funnel-outline" size={18} color={colors.textMuted} />
          <Text style={[typography.bodyMuted, { flex: 1 }]}>
            Nothing here matches {activeCount(filters) === 1 ? 'that filter' : 'those filters'}.
            Clear one and try again.
          </Text>
        </Card>
      ) : (
        items.map((r) => (
          <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => setSel(sel === r.id ? null : r.id)}>
            <Card style={[styles.row, sel === r.id && styles.rowOn]}>
              <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
                <Ionicons name={r.icon} size={19} color={r.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3} numberOfLines={2}>{r.name}</Text>
                <Text style={typography.bodyMuted} numberOfLines={1}>{r.provider}</Text>
                <Text style={typography.caption}>{r.meta}</Text>
                {/* A recommendation should say what it's based on — otherwise
                    it reads as an advert rather than a suggestion. */}
                <View style={styles.reasonRow}>
                  <Ionicons name="sparkles-outline" size={11} color={r.tint} />
                  <Text style={[styles.reason, { color: r.tint }]} numberOfLines={1}>{r.reason}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{r.price === 0 ? 'Free' : inr(r.price)}</Text>
                <Badge label={PRODUCT_LABEL[r.kind]} tone="neutral" />
                <Badge
                  label={groupOf(r) === 'solo' ? 'Individual' : 'Team'}
                  tone={groupOf(r) === 'solo' ? 'primary' : 'warning'}
                />
              </View>
            </Card>
            {sel === r.id ? (
              <TouchableOpacity style={styles.proceedBtn} activeOpacity={0.85} onPress={() => proceed(r)}>
                <Text style={styles.proceedText}>
                  {r.kind === 'appointment'
                    ? 'Proceed — date & time'
                    : 'Proceed — records & pay'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        ))
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 10 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  right: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  reason: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
  headRailScroll: { flexGrow: 0, marginBottom: 14 },
  headRail: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 4 },
  headChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  headChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  headText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  headTextOn: { color: colors.white },
  headCount: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  rowOn: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#F6FAFF' },
  proceedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: -4, marginBottom: 10, paddingVertical: 12, borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  proceedText: { fontSize: 13, fontWeight: '800', color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '47%', gap: 5, padding: 13, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  gridTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
});
