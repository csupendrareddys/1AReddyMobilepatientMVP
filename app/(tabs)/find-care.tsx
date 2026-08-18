import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import DoctorCard from '../../src/components/DoctorCard';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import EmptyState from '../../src/components/EmptyState';
import TabHeader from '../../src/components/TabHeader';
import ViewSwitcher, { ViewMode4 } from '../../src/components/ViewSwitcher';
import ItemViews from '../../src/components/ItemViews';
import {
  consultationTypes, doctors, healthPlans, recoveryPlans, symptoms,
} from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

/** All four things a patient can search for, in one place. */
const CATEGORIES = [
  { key: 'doctors', label: 'Doctors', icon: 'people-outline' as const },
  { key: 'consults', label: 'Quick Consults', icon: 'videocam-outline' as const },
  { key: 'recovery', label: 'Recovery Plans', icon: 'thermometer-outline' as const },
  { key: 'advanced', label: 'Advanced Care', icon: 'heart-circle-outline' as const },
];
type CategoryKey = typeof CATEGORIES[number]['key'];

const matches = (q: string, ...fields: string[]) =>
  !q || fields.some((f) => f.toLowerCase().includes(q.toLowerCase()));

export default function FindCareScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryKey>('doctors');
  const [query, setQuery] = useState('');
  const [activeSymptom, setActiveSymptom] = useState<string | null>(null);
  // One view choice across all four categories — switching category shouldn't
  // silently change how the results are laid out.
  const [mode, setMode] = useState<ViewMode4>('list');

  const filteredDoctors = useMemo(() => doctors.filter((d) => {
    const bySymptom = activeSymptom
      ? d.specializations.some((s) =>
          activeSymptom.includes('Diabetes')
            ? s.includes('Diabetes')
            : s.toLowerCase().includes(activeSymptom.split(' ')[0].toLowerCase()))
      : true;
    return matches(query, d.full_name, ...d.specializations) && bySymptom;
  }), [query, activeSymptom]);

  const filteredConsults = useMemo(
    () => consultationTypes.filter((c) => matches(query, c.name, c.short_name, c.description)),
    [query],
  );
  const filteredRecovery = useMemo(
    () => recoveryPlans.filter((p) => matches(query, p.name, p.condition, p.description)),
    [query],
  );
  const filteredAdvanced = useMemo(
    () => healthPlans.filter((p) => matches(query, p.name, p.speciality, p.category, p.description)),
    [query],
  );

  const counts: Record<CategoryKey, number> = {
    doctors: filteredDoctors.length,
    consults: filteredConsults.length,
    recovery: filteredRecovery.length,
    advanced: filteredAdvanced.length,
  };

  const placeholder = category === 'doctors'
    ? 'Search doctor or specialty'
    : category === 'consults'
      ? 'Search consultation type'
      : category === 'recovery'
        ? 'Search a condition — dengue, typhoid…'
        : 'Search procedure or speciality';

  return (
    <ScreenWrapper>
      <TabHeader
        title="Find Care"
        actions={[{ icon: 'sparkles-outline', label: 'Ask Agent', route: '/agent' }]}
      />

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category switcher — one search box across all four product types. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catWrap}
        contentContainerStyle={styles.catRow}
      >
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.cat, active && styles.catActive]}
            >
              <Ionicons name={c.icon} size={14} color={active ? colors.white : colors.textSecondary} />
              <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
              <View style={[styles.catCount, active && styles.catCountActive]}>
                <Text style={[styles.catCountText, active && styles.catCountTextActive]}>{counts[c.key]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Doctors ─────────────────────────────────────────────── */}
      {category === 'doctors' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipWrap}
            contentContainerStyle={styles.chipRow}
          >
            {symptoms.map((s) => {
              const active = activeSymptom === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setActiveSymptom(active ? null : s)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ViewSwitcher
            mode={mode}
            onChange={setMode}
            hint={mode === 'slide' ? 'Swipe · auto every 20s' : `${filteredDoctors.length} doctors`}
          />

          {filteredDoctors.length ? (
            mode === 'list' ? (
              filteredDoctors.map((d) => (
                <DoctorCard key={d.id} doctor={d} onPress={() => router.push(`/doctor/${d.id}`)} />
              ))
            ) : (
              <ItemViews
                mode={mode}
                intervalSec={20}
                tableTypeLabel="Speciality"
                items={filteredDoctors.map((d) => ({
                  id: d.id,
                  title: d.full_name,
                  subtitle: d.specializations.join(', '),
                  meta: `${d.experience_years} yrs · ★ ${d.rating}`,
                  badge: d.specializations[0],
                  price: d.consultation_fee,
                  icon: 'person-circle-outline' as const,
                  tint: colors.primary,
                }))}
                onPress={(id) => router.push(`/doctor/${id}` as never)}
              />
            )
          ) : (
            <EmptyState icon="medkit-outline" title="No doctors found" subtitle="Try a different search or symptom." />
          )}
        </>
      ) : null}

      {/* ── Quick Consults ──────────────────────────────────────── */}
      {category === 'consults' ? (
        filteredConsults.length ? (
          filteredConsults.map((c) => (
            <TouchableOpacity key={c.key} activeOpacity={0.85} onPress={() => router.push('/book-by-type')}>
              <Card style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name={c.icon} size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{c.name}</Text>
                  <Text style={typography.bodyMuted}>{c.description}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowPrice}>{c.price === 0 ? 'Free' : inr(c.price)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState icon="videocam-outline" title="No consultation types match" />
        )
      ) : null}

      {/* ── Recovery Plans ──────────────────────────────────────── */}
      {category === 'recovery' ? (
        filteredRecovery.length ? (
          filteredRecovery.map((p) => (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => router.push('/more/recovery-plans')}>
              <Card style={styles.planCard}>
                <View style={styles.planTop}>
                  <View style={styles.rowIcon}>
                    <Ionicons name="thermometer-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{p.condition} Recovery Plan</Text>
                    <Text style={typography.caption}>{p.duration_label} guided programme</Text>
                  </View>
                  <Badge label={p.duration_label} tone="primary" />
                </View>
                <Text style={[typography.bodyMuted, styles.desc]} numberOfLines={2}>{p.description}</Text>
                <Text style={styles.planPrice}>{inr(p.price)}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState icon="thermometer-outline" title="No recovery plans match" subtitle="Try malaria, dengue or typhoid." />
        )
      ) : null}

      {/* ── Advanced Care ───────────────────────────────────────── */}
      {category === 'advanced' ? (
        filteredAdvanced.length ? (
          filteredAdvanced.map((p) => (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => router.push('/more/health-plans')}>
              <Card style={[styles.planCard, p.featured && styles.planCardFeatured]}>
                <View style={styles.planTop}>
                  <Text style={[typography.h3, { flex: 1 }]}>{p.short_name}</Text>
                  <Badge label={p.speciality} tone="neutral" />
                </View>
                <Text style={typography.caption}>{p.category} · {p.duration_label}</Text>
                <Text style={[typography.bodyMuted, styles.desc]} numberOfLines={2}>{p.description}</Text>
                <View style={styles.planBottom}>
                  <Text style={styles.planPrice}>{inr(p.patient_price)}</Text>
                  <Text style={styles.planMeta}>
                    {p.doctors_included} doctors · {p.total_consultations} consults
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState icon="heart-circle-outline" title="No care plans match" subtitle="Try heart, kidney or stroke." />
        )
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 12 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  catWrap: { flexGrow: 0, marginTop: 12, marginBottom: 14, marginHorizontal: -16 },
  catRow: { gap: 8, paddingHorizontal: 16 },
  cat: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  catTextActive: { color: colors.white },
  catCount: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center' },
  catCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  catCountText: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  catCountTextActive: { color: colors.white },
  chipWrap: { flexGrow: 0, marginBottom: 14, marginHorizontal: -16 },
  chipRow: { gap: 8, paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowPrice: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  planCard: { marginBottom: 12, gap: 6 },
  planCardFeatured: { borderColor: colors.primary, borderWidth: 2 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  desc: { marginTop: 2 },
  planBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  planPrice: { fontSize: 19, fontWeight: '800', color: colors.primary },
  planMeta: { fontSize: 11.5, color: colors.textMuted },
});
