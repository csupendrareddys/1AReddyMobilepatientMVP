import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import Stepper from '../src/components/Stepper';
import PrimaryButton from '../src/components/PrimaryButton';
import DetailsSheet from '../src/components/DetailsSheet';
import FilterBar from '../src/components/FilterBar';
import EmptyState from '../src/components/EmptyState';
import { useCentringRail } from '../src/components/centringRail';
import {
  favouriteProviders, ProviderKind, ProviderProduct, ProviderProfile,
} from '../src/data/providers';
import { favouriteRefs, isFavourite, toggleFavourite } from '../src/data/favourites';
import {
  activeCount, emptyFilters, genderOfDoctor, matchesFilters,
} from '../src/data/filters';
import { inr } from '../src/data/checkout';
import { colors, radius, typography } from '../src/theme/theme';

/**
 * The providers this patient keeps coming back to.
 *
 * Same steps as Find a Doctor — filters, choose, their products — but the
 * candidate list is the patient's own favourites across all three kinds at
 * once, because "my paediatrician and my local clinic" is one mental list, not
 * three. Picking a product hands over to the same booking screens, so a
 * favourite books identically to anything found by searching.
 */

const STEPS = ['Filters', 'Choose', 'Products'];

const KIND_HEADS = [
  { key: 'all', label: 'All' },
  { key: 'doctor', label: 'Doctors' },
  { key: 'clinic', label: 'Clinics' },
  { key: 'hospital', label: 'Hospitals' },
] as const;
type KindHead = typeof KIND_HEADS[number]['key'];

const GROUP_HEADS = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Individual' },
  { key: 'team', label: 'Team' },
] as const;
type GroupHead = typeof GROUP_HEADS[number]['key'];

export default function FavouritesScreen() {
  const router = useRouter();
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState(emptyFilters());
  const [kindHead, setKindHead] = useState<KindHead>('all');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupHead>('all');
  const [productKey, setProductKey] = useState<string | null>(null);
  const [info, setInfo] = useState<ProviderProfile | null>(null);

  const kindRail = useCentringRail();
  const groupRail = useCentringRail();
  useEffect(() => {
    const t = setTimeout(() => kindRail.centre(kindHead), 80);
    return () => clearTimeout(t);
  }, [kindHead, kindRail.sidePad]);
  useEffect(() => {
    const t = setTimeout(() => groupRail.centre(group), 80);
    return () => clearTimeout(t);
  }, [group, groupRail.sidePad, step]);

  const all = useMemo(() => favouriteProviders(favouriteRefs()), []);

  const shown = all
    .filter((p) => kindHead === 'all' || p.kind === kindHead)
    .filter((p) => matchesFilters(
      [p.name, p.headline, p.specialities.join(' '), p.about, p.city,
        ...p.solo.map((x) => x.name), ...p.team.map((x) => x.name)].join(' '),
      p.kind === 'doctor' ? genderOfDoctor(p.id) : undefined,
      filters,
    ));

  const provider = all.find((p) => p.id === providerId) ?? null;

  const products = provider
    ? [
      ...provider.solo.map((p) => ({ p, g: 'solo' as const })),
      ...provider.team.map((p) => ({ p, g: 'team' as const })),
    ]
      .filter((r) => group === 'all' || r.g === group)
      .filter((r) => matchesFilters(
        `${r.p.name} ${r.p.description} ${r.p.categoryName}`,
        undefined,
        { ...filters, genders: [] },
      ))
    : [];

  const keyOf = (r: { p: ProviderProduct; g: string }) => `${r.g}:${r.p.id}:${r.p.teamId ?? ''}`;

  /** Hands over to the same booking screens the find flow uses. */
  const openProduct = (r: { p: ProviderProduct; g: 'solo' | 'team' }) => {
    const { p } = r;
    router.push({
      pathname: '/book/[category]',
      params: p.type === 'consultation'
        ? { category: p.categoryKey, preselect: p.id }
        : { category: p.categoryKey, preselect: p.id, team: p.teamId ?? '' },
    } as never);
  };

  if (!all.length) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title="Your favourites" />
        <EmptyState
          icon="heart-outline"
          title="No favourites yet"
          subtitle="Open any doctor, clinic or hospital, tap View details, and add them here."
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Your favourites" />
      <Stepper
        steps={STEPS}
        current={step}
        onStep={setStep}
        canNext={step === 1 ? !!provider : step < 2}
      />

      {/* ── Step 1 · filters ──────────────────────────────────────── */}
      {step === 0 ? (
        <>
          {/* Skip sits at the top as well as the bottom: a patient who
              doesn't want to filter shouldn't have to scroll past four
              filters to say so. */}
          <TouchableOpacity
            style={styles.topSkip}
            activeOpacity={0.8}
            onPress={() => { setFilters(emptyFilters()); setStep(1); }}
          >
            <Ionicons name="play-forward-outline" size={14} color={colors.primary} />
            <Text style={styles.topSkipText}>Skip filters — show everything</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[typography.bodyMuted, styles.intro]}>
            Narrow your saved providers down — or skip and see all {all.length}.
          </Text>
          <FilterBar
            value={filters}
            onChange={setFilters}
            resultCount={shown.length}
            // Everything compact except clinical specialisation, which is the
            // one table this page keeps — same as the other filter pages.
            dropdownGroups={['symptoms', 'specializations', 'genders', 'organs', 'locations']}
          />
          <View style={styles.navRow}>
            <PrimaryButton
              label="Skip filters"
              variant="outline"
              style={styles.navBtn}
              onPress={() => { setFilters(emptyFilters()); setStep(1); }}
            />
            <PrimaryButton
              label={activeCount(filters) ? `Apply ${activeCount(filters)} & continue` : 'Continue'}
              style={styles.navBtn}
              onPress={() => setStep(1)}
            />
          </View>
        </>
      ) : null}

      {/* ── Step 2 · which favourite ──────────────────────────────── */}
      {step === 1 ? (
        <>
          <ScrollView
            ref={kindRail.ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
            contentContainerStyle={[styles.railContent, { paddingHorizontal: kindRail.sidePad }]}
            onLayout={kindRail.onRailLayout}
          >
            {KIND_HEADS.map((h) => {
              const on = kindHead === h.key;
              const count = h.key === 'all'
                ? all.length : all.filter((p) => p.kind === h.key).length;
              return (
                <TouchableOpacity
                  key={h.key}
                  onLayout={kindRail.onChipLayout(h.key)}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => { setKindHead(h.key); setProviderId(null); }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{h.label}</Text>
                  <View style={[styles.count, on && styles.countOn]}>
                    <Text style={[styles.countText, on && styles.countTextOn]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {!shown.length ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="funnel-outline" size={17} color={colors.textMuted} />
              <Text style={[typography.bodyMuted, { flex: 1 }]}>
                None of your favourites match. Clear a filter or switch head.
              </Text>
            </Card>
          ) : null}

          {shown.map((p) => {
            const on = providerId === p.id;
            return (
              <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => setProviderId(p.id)}>
                <Card style={[styles.card, on && styles.cardOn]}>
                  <View style={styles.cardTop}>
                    <Image source={{ uri: p.avatar }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.h3}>{p.name}</Text>
                      <Text style={typography.caption}>{p.headline}</Text>
                      <Text style={typography.caption}>{p.city}</Text>
                    </View>
                    <Ionicons name="heart" size={17} color={colors.error} />
                  </View>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={p.kind === 'doctor' ? 'Doctor' : p.kind === 'clinic' ? 'Clinic' : 'Hospital'}
                      tone="primary"
                    />
                    <Text style={typography.caption}>
                      ★ {p.rating} · {p.solo.length + p.team.length} products
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.caption}>Starts at</Text>
                      <Text style={styles.price}>{inr(p.startsAt)}</Text>
                    </View>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => setInfo(p)}>
                      <Ionicons name="eye-outline" size={14} color={colors.primary} />
                      <Text style={styles.detailBtnText}>View details</Text>
                    </TouchableOpacity>
                  </View>
                  {on ? (
                    <TouchableOpacity
                      style={styles.cardContinue}
                      activeOpacity={0.85}
                      onPress={() => setStep(2)}
                    >
                      <Text style={styles.cardContinueText}>Continue — see products</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}

      {/* ── Step 3 · their products ───────────────────────────────── */}
      {step === 2 && provider ? (
        <>
          <Text style={[typography.bodyMuted, styles.intro]}>
            Everything {provider.name} offers.
          </Text>
          <ScrollView
            ref={groupRail.ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
            contentContainerStyle={[styles.railContent, { paddingHorizontal: groupRail.sidePad }]}
            onLayout={groupRail.onRailLayout}
          >
            {GROUP_HEADS.map((h) => {
              const on = group === h.key;
              const count = h.key === 'all'
                ? provider.solo.length + provider.team.length
                : h.key === 'solo' ? provider.solo.length : provider.team.length;
              return (
                <TouchableOpacity
                  key={h.key}
                  onLayout={groupRail.onChipLayout(h.key)}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => { setGroup(h.key); setProductKey(null); }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{h.label}</Text>
                  <View style={[styles.count, on && styles.countOn]}>
                    <Text style={[styles.countText, on && styles.countTextOn]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {products.map((r) => {
            const k = keyOf(r);
            const on = productKey === k;
            const consult = r.p.type === 'consultation';
            return (
              <TouchableOpacity key={k} activeOpacity={0.85} onPress={() => setProductKey(k)}>
                <Card style={[styles.card, on && styles.cardOn]}>
                  <Text style={typography.h3}>{r.p.name}</Text>
                  <Text style={typography.caption}>{r.p.categoryName}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={consult ? 'Consultation' : 'Plan'} tone={consult ? 'primary' : 'warning'} />
                    <Badge
                      label={r.g === 'solo' ? 'Individual' : `Team · ${r.p.teamName ?? ''}`}
                      tone="neutral"
                    />
                  </View>
                  <Text style={typography.bodyMuted} numberOfLines={2}>{r.p.description}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{inr(r.p.price)}</Text>
                    <Text style={typography.caption}>{r.p.meta}</Text>
                  </View>
                  {on ? (
                    <TouchableOpacity
                      style={styles.cardContinue}
                      activeOpacity={0.85}
                      onPress={() => openProduct(r)}
                    >
                      <Text style={styles.cardContinueText}>
                        {consult ? 'Continue — pick a time' : 'Continue — records & pay'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}

      {/* View details, with the favourite toggle inside it. */}
      <DetailsSheet
        visible={!!info}
        onClose={() => setInfo(null)}
        title={info?.name ?? ''}
        subtitle={info ? `${info.headline} · ${info.city}` : undefined}
        rows={info?.details ?? []}
        about={info?.about ?? ''}
        moreLabel="More about this provider"
        footer={info ? {
          label: isFavourite(info.kind, info.id)
            ? 'Remove from favourites' : 'Add to favourites',
          onPress: () => { toggleFavourite(info.kind, info.id); setInfo(null); bump(); },
        } : undefined}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12 },
  rail: { flexGrow: 0, marginBottom: 12 },
  railContent: { gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 15, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  count: {
    minWidth: 20, paddingHorizontal: 6, borderRadius: radius.pill,
    backgroundColor: colors.background, alignItems: 'center',
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  countTextOn: { color: colors.white },
  card: { gap: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardOn: { borderColor: colors.primary, backgroundColor: '#F6FAFF' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  priceRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
    paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  price: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primary,
  },
  detailBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cardContinue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  cardContinueText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  topSkip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginBottom: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  topSkipText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  navBtn: { flex: 1 },
});
