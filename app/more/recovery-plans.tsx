import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import { recoveryPlans, recoveryPlanOrders, RecoveryPlan, PlanOrder } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

const statusTone: Record<PlanOrder['status'], 'warning' | 'primary' | 'success' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'primary',
  rejected: 'neutral',
  in_process: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

export default function RecoveryPlansScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'browse' | 'orders'>('browse');
  const [detail, setDetail] = useState<RecoveryPlan | null>(null);
  const [started, setStarted] = useState(false);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Recovery Plans" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Short, guided plans that see you through a specific illness — day one to recovery.
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'browse' && styles.tabActive]} onPress={() => setTab('browse')}>
          <Text style={[styles.tabText, tab === 'browse' && styles.tabTextActive]}>Browse Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'orders' && styles.tabActive]} onPress={() => setTab('orders')}>
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>My Plans ({recoveryPlanOrders.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'browse' ? (
        recoveryPlans.map((p) => (
          <Card key={p.id} style={styles.card}>
            <View style={styles.top}>
              <View style={styles.condWrap}>
                <View style={styles.condIcon}>
                  <Ionicons name="thermometer-outline" size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{p.condition} Recovery Plan</Text>
                  <Text style={typography.caption}>{p.duration_label} guided programme</Text>
                </View>
              </View>
              <Badge label={p.duration_label} tone="primary" />
            </View>

            <Text style={[typography.bodyMuted, styles.desc]}>{p.description}</Text>

            <View style={styles.bottom}>
              <Text style={styles.price}>{inr(p.price)}</Text>
              <TouchableOpacity style={styles.startBtn} onPress={() => { setDetail(p); setStarted(false); }}>
                <Text style={styles.startText}>View & start</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      ) : (
        recoveryPlanOrders.map((o) => (
          <Card key={o.id} style={styles.orderRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>{o.plan_name}</Text>
              <Text style={typography.bodyMuted}>Started {o.ordered_on}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>{inr(o.amount)}</Text>
              <Badge label={o.status.replace('_', ' ')} tone={statusTone[o.status]} />
            </View>
          </Card>
        ))
      )}

      <AppModal visible={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
        {detail ? (
          started ? (
            <View style={styles.doneWrap}>
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              <Text style={[typography.h3, styles.doneTitle]}>Plan started</Text>
              <Text style={[typography.bodyMuted, styles.doneSub]}>
                Day 1 of {detail.duration_days} begins today. Your care team will check in shortly.
              </Text>
              <PrimaryButton label="Done" style={styles.modalCta} onPress={() => { setDetail(null); setTab('orders'); }} />
            </View>
          ) : (
            <>
              <Text style={styles.price}>{inr(detail.price)}</Text>
              <Text style={typography.caption}>{detail.duration_label} · taxes included</Text>
              <Text style={[typography.body, styles.desc]}>{detail.description}</Text>

              <Text style={[typography.label, styles.blockLabel]}>WHAT'S INCLUDED</Text>
              {detail.includes.map((inc) => (
                <View key={inc} style={styles.incRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.secondaryDark} />
                  <Text style={typography.body}>{inc}</Text>
                </View>
              ))}

              {/* Enrolment settles through the shared checkout, so a recovery
                  plan gets the same records-sharing step and payment options
                  as every other product. */}
              <PrimaryButton
                label={`Start plan · ${inr(detail.price)}`}
                style={styles.modalCta}
                onPress={() => {
                  const plan = detail;
                  setDetail(null);
                  router.push({
                    pathname: '/checkout',
                    params: {
                      kind: 'recovery_plan',
                      name: plan.name,
                      price: String(plan.price),
                      provider: plan.condition,
                      meta: plan.duration_label,
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
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 4, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm - 2, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  card: { marginBottom: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  condWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  condIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  desc: { marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 21, fontWeight: '800', color: colors.primary },
  startBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.sm },
  startText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  orderRight: { alignItems: 'flex-end', gap: 5 },
  orderAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  blockLabel: { marginTop: 12, marginBottom: 4 },
  incRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 3 },
  modalCta: { marginTop: 18 },
  doneWrap: { alignItems: 'center', paddingVertical: 12 },
  doneTitle: { marginTop: 12 },
  doneSub: { marginTop: 4, textAlign: 'center' },
});
