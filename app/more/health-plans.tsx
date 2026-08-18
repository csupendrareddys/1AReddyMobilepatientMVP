import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import EmptyState from '../../src/components/EmptyState';
import { careTeams, healthPlans, HealthPlan, planBookings, PlanBooking } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

const statusTone: Record<PlanBooking['status'], 'warning' | 'success' | 'primary' | 'neutral'> = {
  pending_payment: 'warning',
  confirmed: 'primary',
  rejected: 'neutral',
  pending_acceptance: 'warning',
  active: 'success',
  completed: 'primary',
  cancelled: 'neutral',
};

const BUCKETS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (s: string) => s.startsWith('pending') },
  { key: 'active', label: 'In Process', match: (s: string) => s === 'active' },
  { key: 'completed', label: 'Completed', match: (s: string) => s === 'completed' },
];

export default function HealthPlansScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [bucket, setBucket] = useState('all');
  const [detail, setDetail] = useState<HealthPlan | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const activeBucket = BUCKETS.find((b) => b.key === bucket) ?? BUCKETS[0];
  const shown = planBookings.filter((b) => activeBucket.match(b.status));
  const teams = detail ? careTeams[detail.id] ?? [] : [];

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Advanced Care" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Surgical recovery and long-term chronic management — a team of specialists
        under one plan, paid in installments.
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'available' && styles.tabActive]} onPress={() => setTab('available')}>
          <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>Available Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Plans ({planBookings.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'available' ? (
        // Grouped by Surgical Recovery vs Chronic Management so the two very
        // different needs are scannable rather than mixed into one list.
        (['Surgical Recovery', 'Chronic Management'] as const).map((group) => (
          <View key={group}>
            <Text style={[typography.label, styles.groupHeading]}>{group.toUpperCase()}</Text>
            {healthPlans.filter((p) => p.category === group).map((p) => (
          <Card key={p.id} style={[styles.planCard, p.featured && styles.planCardFeatured]}>
            <View style={styles.planTop}>
              <Text style={[typography.h3, styles.planName]}>{p.name}</Text>
              <Badge label={p.speciality} tone="neutral" />
            </View>
            <Text style={styles.price}>{inr(p.patient_price)}</Text>
            <Text style={typography.caption}>for {p.duration_label} · taxes included</Text>
            <Text style={[typography.bodyMuted, styles.desc]}>{p.description}</Text>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>{p.doctors_included} doctors</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>{p.total_consultations} consultations</Text>
              </View>
            </View>
            <PrimaryButton
              label="View & book"
              style={styles.cta}
              onPress={() => { setDetail(p); setTeam(null); setBooked(false); }}
            />
          </Card>
            ))}
          </View>
        ))
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bucketWrap} contentContainerStyle={styles.bucketRow}>
            {BUCKETS.map((b) => (
              <TouchableOpacity key={b.key} style={[styles.bucket, bucket === b.key && styles.bucketActive]} onPress={() => setBucket(b.key)}>
                <Text style={[styles.bucketText, bucket === b.key && styles.bucketTextActive]}>
                  {b.label} ({planBookings.filter((x) => b.match(x.status)).length})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {shown.length ? shown.map((b) => {
            const nextDue = b.installments.find((i) => i.status !== 'paid');
            return (
              <Card key={b.id} style={styles.bookingCard}>
                <View style={styles.planTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{b.plan_name}</Text>
                    <Text style={typography.bodyMuted}>
                      {b.team_name} · Paid {inr(b.amount_paid)} of {inr(b.total_payable)}
                    </Text>
                  </View>
                  <Badge label={b.status.replace('_', ' ')} tone={statusTone[b.status]} />
                </View>

                <Text style={[typography.label, styles.blockLabel]}>INSTALLMENTS</Text>
                {b.installments.map((i) => (
                  <View key={i.id} style={styles.instRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>
                        #{i.installment_no}{i.is_booking ? ' (booking)' : ''} · {inr(i.amount)}
                      </Text>
                      <Text style={typography.caption}>{i.due_label}</Text>
                    </View>
                    {i.status === 'paid' ? (
                      <Badge label="Paid" tone="success" />
                    ) : nextDue?.id === i.id ? (
                      <TouchableOpacity style={styles.payBtn}>
                        <Text style={styles.payText}>Pay {inr(i.amount)}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Badge label="Pending" tone="warning" />
                    )}
                  </View>
                ))}

                {b.documents.length ? (
                  <>
                    <Text style={[typography.label, styles.blockLabel]}>DOCUMENTS FROM YOUR CARE TEAM</Text>
                    {b.documents.map((d) => (
                      <View key={d.id} style={styles.docRow}>
                        <Ionicons name="document-text-outline" size={15} color={colors.warningDark} />
                        <View style={{ flex: 1 }}>
                          <Text style={typography.body}>{d.file_name}</Text>
                          <Text style={typography.caption}>
                            {d.doctor_name}{d.note ? ` — ${d.note}` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                ) : null}
              </Card>
            );
          }) : (
            <EmptyState icon="albums-outline" title="No plans in this bucket" />
          )}
        </>
      )}

      {/* Plan detail + care-team picker */}
      <AppModal visible={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
        {detail ? (
          booked ? (
            <View style={styles.bookedWrap}>
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              <Text style={[typography.h3, styles.bookedTitle]}>Plan booked</Text>
              <Text style={[typography.bodyMuted, styles.bookedSub]}>
                Your first installment is due to activate {detail.name}.
              </Text>
              <PrimaryButton label="Done" style={styles.modalCta} onPress={() => { setDetail(null); setTab('mine'); }} />
            </View>
          ) : (
            <>
              <Text style={styles.price}>{inr(detail.patient_price)}</Text>
              <Text style={typography.caption}>for {detail.duration_label} · taxes included</Text>
              <Text style={[typography.body, styles.desc]}>{detail.description}</Text>

              <Text style={[typography.label, styles.blockLabel]}>WHAT'S INCLUDED</Text>
              {detail.includes.map((inc) => (
                <View key={inc} style={styles.incRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.secondaryDark} />
                  <Text style={typography.body}>{inc}</Text>
                </View>
              ))}

              <Text style={[typography.label, styles.blockLabel]}>CHOOSE A CARE TEAM</Text>
              {teams.map((t) => {
                const active = team === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.teamRow, active && styles.teamRowActive]}
                    onPress={() => setTeam(t.id)}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>{t.name}</Text>
                      <Text style={typography.caption}>Led by {t.lead} · {t.hospital}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <PrimaryButton
                label={team ? 'Book plan' : 'Pick a care team'}
                disabled={!team}
                style={styles.modalCta}
                onPress={() => {
                  const plan = detail;
                  const picked = teams.find((t) => t.id === team);
                  setDetail(null);
                  router.push({
                    pathname: '/checkout',
                    params: {
                      kind: 'advanced_plan',
                      name: plan.name,
                      price: String(plan.patient_price),
                      provider: picked ? picked.name : '',
                      meta: plan.duration_label,
                      installments: '3',
                    },
                  } as never);
                }}
              />
            </>
          )
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 16 },
  groupHeading: { marginBottom: 10, marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 4, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm - 2, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  planCard: { marginBottom: 14, gap: 4 },
  planCardFeatured: { borderColor: colors.primary, borderWidth: 2 },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  planName: { flex: 1 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 4 },
  desc: { marginTop: 6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 10 },
  metaRow: { flexDirection: 'row', gap: 18 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5, color: colors.textSecondary },
  cta: { marginTop: 12 },
  bucketWrap: { flexGrow: 0, marginBottom: 14 },
  bucketRow: { gap: 8 },
  bucket: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  bucketActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bucketText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  bucketTextActive: { color: colors.white },
  bookingCard: { marginBottom: 14, gap: 8 },
  blockLabel: { marginTop: 8 },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  payBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm },
  payText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  incRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 3 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  teamRowActive: { borderColor: colors.primary, borderWidth: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  modalCta: { marginTop: 16 },
  bookedWrap: { alignItems: 'center', paddingVertical: 12 },
  bookedTitle: { marginTop: 12 },
  bookedSub: { marginTop: 4, textAlign: 'center' },
});
