import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import Stepper from '../../src/components/Stepper';
import PrimaryButton from '../../src/components/PrimaryButton';
import EmptyState from '../../src/components/EmptyState';
import FilterBar from '../../src/components/FilterBar';
import { useCentringRail } from '../../src/components/centringRail';
import { isFavourite, toggleFavourite } from '../../src/data/favourites';
import {
  activeCount, emptyFilters, genderOfDoctor, matchesFilters,
} from '../../src/data/filters';
import {
  ProviderKind, PROVIDER_KINDS, ProviderProduct, ProviderProfile, providersOfKind,
} from '../../src/data/providers';
import { inr } from '../../src/data/checkout';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * Finding care by who gives it: a doctor, a clinic or a hospital.
 *
 * Three steps here — pick a provider, read them properly, pick one of their
 * products — and then the flow hands over to the booking the product needs:
 * a consultation goes on to its slot page, a plan (whose team is already
 * decided by the provider you're on) goes straight to Records. The category
 * flow and this one converge on the same screens, so a product costs and
 * behaves the same however it was found.
 */

const STEPS = ['Filters', 'Choose', 'Profile', 'Products'];

/** The product-list heads. "Individual" is what they do alone; "Team" is what they deliver with others. */
const HEADS = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Individual' },
  { key: 'team', label: 'Team' },
] as const;
type HeadKey = typeof HEADS[number]['key'];

export default function FindProviderScreen() {
  const { kind: kindParam } = useLocalSearchParams<{ kind: string }>();
  const router = useRouter();
  const kind = (['doctor', 'clinic', 'hospital'].includes(kindParam ?? '')
    ? kindParam : 'doctor') as ProviderKind;
  const meta = PROVIDER_KINDS.find((k) => k.key === kind)!;

  const allProviders = useMemo(() => providersOfKind(kind), [kind]);
  const [filters, setFilters] = useState(emptyFilters());
  const [, bumpFav] = useReducer((n: number) => n + 1, 0);
  // Gender only means anything for people; a clinic filtered to "female"
  // would just be an empty list with no explanation.
  const providers = allProviders.filter((pr) => matchesFilters(
    [pr.name, pr.headline, pr.specialities.join(' '), pr.about, pr.city,
      ...pr.solo.map((x) => x.name), ...pr.team.map((x) => x.name)].join(' '),
    kind === 'doctor' ? genderOfDoctor(pr.id) : undefined,
    filters,
  ));

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState<string | null>(null);
  const provider = providers.find((p) => p.id === providerId) ?? null;

  const [head, setHead] = useState<HeadKey>('all');
  const [productKey, setProductKey] = useState<string | null>(null);

  // The head rail centres its selection, the way the My Bookings status rail
  // does — "All" sits in the middle by default so both other heads are visibly
  // one flick away.
  const rail = useCentringRail();
  const centreHead = (k: HeadKey) => rail.centre(k);
  const pickHead = (k: HeadKey) => { setHead(k); setProductKey(null); };
  // After the product list re-renders for the new head, settle it centre.
  useEffect(() => {
    const t = setTimeout(() => rail.centre(head), 80);
    return () => clearTimeout(t);
  }, [head, rail.sidePad, step]);

  const products: { p: ProviderProduct; group: 'solo' | 'team' }[] = provider
    ? [
      ...provider.solo.map((p) => ({ p, group: 'solo' as const })),
      ...provider.team.map((p) => ({ p, group: 'team' as const })),
    ].filter((row) => head === 'all' || row.group === head)
      .filter((row) => matchesFilters(
        `${row.p.name} ${row.p.description} ${row.p.categoryName}`,
        undefined,
        { ...filters, genders: [] },
      ))
    : [];

  /** One product can appear as solo and team; key on both so picks don't collide. */
  const keyOf = (row: { p: ProviderProduct; group: string }) => `${row.group}:${row.p.id}:${row.p.teamId ?? ''}`;

  const openProduct = (row: { p: ProviderProduct; group: 'solo' | 'team' }) => {
    const { p } = row;
    if (p.type === 'consultation') {
      // Slot page → Records → Pay.
      router.push({
        pathname: '/book/[category]',
        params: { category: p.categoryKey, preselect: p.id },
      } as never);
    } else {
      // The provider IS the team, so team choice is already made:
      // Records → Pay.
      router.push({
        pathname: '/book/[category]',
        params: { category: p.categoryKey, preselect: p.id, team: p.teamId ?? '' },
      } as never);
    }
  };

  if (!allProviders.length) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title={meta.label} />
        <EmptyState icon="search-outline" title={`No ${meta.plural.toLowerCase()} found`} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title={meta.label} />
      <Stepper
        steps={STEPS}
        current={step}
        onStep={setStep}
        canNext={step === 1 ? !!provider : step < 3}
      />

      {/* ── Step 1 · choose a provider ────────────────────────────── */}
      {/* ── Step 1 · filters, a page of their own ─────────────────── */}
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
            Narrow the {meta.plural.toLowerCase()} down first — or skip and browse
            everything.
          </Text>
          <FilterBar
            value={filters}
            onChange={setFilters}
            showGender={kind === 'doctor'}
            resultCount={providers.length}
          />
          <View style={styles.filterNav}>
            <PrimaryButton
              label="Skip filters"
              variant="outline"
              style={styles.filterNavBtn}
              onPress={() => { setFilters(emptyFilters()); setStep(1); }}
            />
            <PrimaryButton
              label={activeCount(filters)
                ? `Apply ${activeCount(filters)} & continue` : 'Continue'}
              style={styles.filterNavBtn}
              onPress={() => setStep(1)}
            />
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={[typography.bodyMuted, styles.intro]}>{meta.blurb}</Text>
          {activeCount(filters) > 0 ? (
            <TouchableOpacity style={styles.filterSummary} onPress={() => setStep(0)}>
              <Ionicons name="funnel" size={13} color={colors.primary} />
              <Text style={styles.filterSummaryText}>
                {activeCount(filters)} filter{activeCount(filters) === 1 ? '' : 's'} ·{' '}
                {providers.length} match{providers.length === 1 ? '' : 'es'} — edit
              </Text>
            </TouchableOpacity>
          ) : null}
          {!providers.length ? (
            <Card style={styles.card}>
              <Text style={typography.bodyMuted}>
                Nothing matches these filters. Clear one or two and try again.
              </Text>
            </Card>
          ) : null}
          {providers.map((pr) => {
            const on = providerId === pr.id;
            return (
              <TouchableOpacity key={pr.id} activeOpacity={0.85} onPress={() => setProviderId(pr.id)}>
                <Card style={[styles.card, on && styles.cardOn]}>
                  <View style={styles.cardTop}>
                    <Image source={{ uri: pr.avatar }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.h3}>{pr.name}</Text>
                      <Text style={typography.caption}>{pr.headline}</Text>
                      <Text style={typography.caption}>{pr.city}</Text>
                    </View>
                    <TouchableOpacity
                      hitSlop={10}
                      onPress={() => { toggleFavourite(kind, pr.id); bumpFav(); }}
                      accessibilityLabel={isFavourite(kind, pr.id)
                        ? `Remove ${pr.name} from favourites` : `Add ${pr.name} to favourites`}
                    >
                      <Ionicons
                        name={isFavourite(kind, pr.id) ? 'heart' : 'heart-outline'}
                        size={19}
                        color={isFavourite(kind, pr.id) ? colors.error : colors.textMuted}
                      />
                    </TouchableOpacity>
                    {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </View>

                  <View style={styles.statRow}>
                    <Stat icon="star" tint={colors.warning} label={`${pr.rating} · ${pr.reviews} reviews`} />
                    <Stat icon="time-outline" tint={colors.textSecondary} label={`${pr.experienceYears} yrs`} />
                  </View>
                  {pr.specialities.length ? (
                    <Text style={typography.caption} numberOfLines={1}>
                      {pr.specialities.join(' · ')}
                    </Text>
                  ) : null}

                  <View style={styles.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.caption}>Starts at</Text>
                      <Text style={styles.price}>{inr(pr.startsAt)}</Text>
                    </View>
                    <Text style={typography.caption}>
                      {pr.solo.length + pr.team.length} products
                    </Text>
                  </View>

                  {on ? (
                    <TouchableOpacity
                      style={styles.cardContinue}
                      activeOpacity={0.85}
                      onPress={() => setStep(2)}
                    >
                      <Text style={styles.cardContinueText}>Continue — view profile</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}

      {/* ── Step 2 · the provider in full ─────────────────────────── */}
      {step === 2 && provider ? (
        <>
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <Image source={{ uri: provider.avatar }} style={styles.avatarLg} />
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>{provider.name}</Text>
                <Text style={typography.bodyMuted}>{provider.headline}</Text>
                <Text style={typography.caption}>{provider.city}</Text>
              </View>
            </View>
            <Text style={[typography.body, styles.about]}>{provider.about}</Text>
          </Card>

          <Card style={styles.table}>
            {provider.details.map((d) => (
              <View key={d.label} style={styles.tr}>
                <Text style={styles.th}>{d.label}</Text>
                <Text style={styles.td}>{d.value}</Text>
              </View>
            ))}
          </Card>

          <TouchableOpacity
            style={[styles.favBtn, isFavourite(kind, provider.id) && styles.favBtnOn]}
            onPress={() => { toggleFavourite(kind, provider.id); bumpFav(); }}
          >
            <Ionicons
              name={isFavourite(kind, provider.id) ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavourite(kind, provider.id) ? colors.white : colors.error}
            />
            <Text style={[
              styles.favBtnText,
              isFavourite(kind, provider.id) && styles.favBtnTextOn,
            ]}>
              {isFavourite(kind, provider.id)
                ? 'Saved to your favourites' : 'Add to your favourites'}
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            label={`Proceed — see ${provider.solo.length + provider.team.length} products`}
            style={styles.proceed}
            onPress={() => setStep(3)}
          />
        </>
      ) : null}

      {/* ── Step 4 · their products, under three heads ────────────── */}
      {step === 3 && provider ? (
        <>
          <Text style={[typography.bodyMuted, styles.intro]}>
            Everything {provider.name} offers. Individual products are theirs alone;
            team products are delivered with their colleagues.
          </Text>

          <ScrollView
            ref={rail.ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
            contentContainerStyle={[styles.railContent, { paddingHorizontal: rail.sidePad }]}
            onLayout={(e) => { rail.onRailLayout(e); centreHead(head); }}
          >
            {HEADS.map((h) => {
              const on = head === h.key;
              const count = h.key === 'all'
                ? provider.solo.length + provider.team.length
                : h.key === 'solo' ? provider.solo.length : provider.team.length;
              return (
                <TouchableOpacity
                  key={h.key}
                  onLayout={(e) => {
                    rail.onChipLayout(h.key)(e);
                    if (h.key === head) centreHead(h.key);
                  }}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => pickHead(h.key)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{h.label}</Text>
                  <View style={[styles.count, on && styles.countOn]}>
                    <Text style={[styles.countText, on && styles.countTextOn]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {products.length ? products.map((row) => {
            const k = keyOf(row);
            const on = productKey === k;
            const consult = row.p.type === 'consultation';
            return (
              <TouchableOpacity key={k} activeOpacity={0.85} onPress={() => setProductKey(k)}>
                <Card style={[styles.card, on && styles.cardOn]}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.h3}>{row.p.name}</Text>
                      <Text style={typography.caption}>{row.p.categoryName}</Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
                  </View>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={consult ? 'Consultation' : 'Plan'}
                      tone={consult ? 'primary' : 'warning'}
                    />
                    <Badge
                      label={row.group === 'solo' ? 'Individual' : `Team · ${row.p.teamName ?? ''}`}
                      tone="neutral"
                    />
                  </View>
                  <Text style={typography.bodyMuted} numberOfLines={2}>{row.p.description}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{inr(row.p.price)}</Text>
                    <Text style={typography.caption}>{row.p.meta}</Text>
                  </View>

                  {on ? (
                    <TouchableOpacity
                      style={styles.cardContinue}
                      activeOpacity={0.85}
                      onPress={() => openProduct(row)}
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
          }) : (
            <Card style={styles.card}>
              <Text style={typography.bodyMuted}>
                Nothing under this head — try another.
              </Text>
            </Card>
          )}
        </>
      ) : null}

      {step > 0 ? (
        <PrimaryButton
          label="Back"
          variant="outline"
          style={styles.back}
          onPress={() => setStep(step - 1)}
        />
      ) : null}
    </ScreenWrapper>
  );
}

function Stat({ icon, tint, label }: {
  icon: keyof typeof Ionicons.glyphMap; tint: string; label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={13} color={tint} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12 },
  topSkip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginBottom: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  topSkipText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  filterNav: { flexDirection: 'row', gap: 10, marginTop: 16 },
  filterNavBtn: { flex: 1 },
  filterSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginBottom: 12, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  filterSummaryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  card: { gap: 9, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardOn: { borderColor: colors.primary, backgroundColor: '#F6FAFF' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarLg: { width: 58, height: 58, borderRadius: 29 },
  statRow: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11.5, color: colors.textSecondary },
  priceRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
    paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  price: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  cardContinue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 4, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  cardContinueText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
  about: { lineHeight: 20 },
  table: { marginBottom: 12, gap: 0, paddingVertical: 4 },
  tr: {
    flexDirection: 'row', gap: 12, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  th: { flex: 1, fontSize: 12, color: colors.textSecondary },
  td: { flex: 1.4, fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  proceed: { marginTop: 4 },
  favBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginBottom: 10, paddingVertical: 12, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.surface,
  },
  favBtnOn: { backgroundColor: colors.error, borderColor: colors.error },
  favBtnText: { fontSize: 13, fontWeight: '800', color: colors.error },
  favBtnTextOn: { color: colors.white },
  rail: { flexGrow: 0, marginBottom: 12 },
  railContent: { gap: 8, paddingHorizontal: 4, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  count: {
    minWidth: 21, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill,
    backgroundColor: colors.background, alignItems: 'center',
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  countTextOn: { color: colors.white },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  back: { marginTop: 8 },
});
