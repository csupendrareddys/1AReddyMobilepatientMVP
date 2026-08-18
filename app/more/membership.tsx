import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import PrimaryButton from '../../src/components/PrimaryButton';
import {
  BillingPeriod, healthCredits, membershipSubscription, membershipTiers,
  MembershipTier, PERIOD_LABEL, SubscriptionStatus,
} from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TONE: Record<SubscriptionStatus, 'warning' | 'primary' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning', trial: 'primary', active: 'success',
  past_due: 'error', cancelled: 'neutral', suspended: 'error',
};

type Relation = 'current' | 'upgrade' | 'downgrade' | 'lateral';

const RELATION_CHIP: Record<Relation, { label: string; tone: 'neutral' | 'success' | 'warning' | 'primary' }> = {
  current: { label: 'Current', tone: 'neutral' },
  upgrade: { label: 'Upgrade', tone: 'success' },
  downgrade: { label: 'Downgrade', tone: 'warning' },
  lateral: { label: 'Switch', tone: 'primary' },
};

export default function MembershipScreen() {
  const sub = membershipSubscription;
  const currentTier = membershipTiers.find((t) => t.id === sub.plan_id)!;

  const [selId, setSelId] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [credits, setCredits] = useState(0);
  const [done, setDone] = useState('');

  const selected = membershipTiers.find((t) => t.id === selId) ?? null;

  const relationOf = (t: MembershipTier): Relation => {
    if (t.id === currentTier.id) return 'current';
    if (t.rank > currentTier.rank) return 'upgrade';
    if (t.rank < currentTier.rank) return 'downgrade';
    return 'lateral';
  };

  const periodsFor = (t: MembershipTier) =>
    (Object.keys(t.periods) as BillingPeriod[]).filter((p) => t.periods[p] != null);

  /**
   * Stands in for the server's quote. Upgrading credits the unused part of the
   * current period; a mid-cycle downgrade isn't priced at all — it's scheduled
   * for the next cycle, which is what the web does too.
   */
  const quote = useMemo(() => {
    if (!selected) return null;
    const rel = relationOf(selected);
    const listPrice = selected.periods[period] ?? 0;

    if (rel === 'downgrade') {
      return { scheduled: true, amount: 0, credit: 0, listPrice };
    }
    // Unused portion of the current monthly plan, pro-rated by days remaining.
    const dailyRate = (currentTier.periods.monthly ?? 0) / 30;
    const credit = rel === 'upgrade' ? Math.round(dailyRate * sub.days_remaining) : 0;
    return {
      scheduled: false,
      listPrice,
      credit,
      amount: Math.max(0, listPrice - credit),
    };
  }, [selected, period]);

  const maxCredit = quote && !quote.scheduled
    ? Math.min(healthCredits.available, Math.floor(quote.amount * healthCredits.max_redeemable_pct / 100))
    : 0;
  const payable = quote ? Math.max(0, quote.amount - Math.min(credits, maxCredit)) : 0;

  const pickTier = (t: MembershipTier) => {
    setSelId(t.id === selId ? null : t.id);
    setPeriod(periodsFor(t)[0] ?? 'monthly');
    setCredits(0);
    setDone('');
  };

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="My Membership" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Your membership tier and its benefits. Upgrade any time — the unused part of
        your current plan is credited. Downgrades take effect at your next cycle.
      </Text>

      {/* ── Current tier ─────────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <Ionicons name="ribbon" size={20} color={colors.white} />
          <Badge label={sub.status.replace('_', ' ')} tone={STATUS_TONE[sub.status]} />
        </View>
        <Text style={styles.heroName}>{currentTier.name}</Text>
        <Text style={styles.heroPrice}>
          {(currentTier.periods.monthly ?? 0) === 0
            ? 'Free'
            : `${money(currentTier.periods.monthly!)}/mo · ${PERIOD_LABEL[sub.plan_period]}`}
        </Text>
        {currentTier.member_discount_pct > 0 ? (
          <View style={styles.heroDiscount}>
            <Text style={styles.heroDiscountText}>
              Up to {currentTier.member_discount_pct}% off consultations and services
            </Text>
          </View>
        ) : null}
        <Text style={styles.heroRenew}>Renews on {sub.current_period_end}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{healthCredits.available}</Text>
          <Text style={typography.caption}>Health credits</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{sub.days_remaining}</Text>
          <Text style={typography.caption}>Days left in cycle</Text>
        </Card>
      </View>

      {done ? (
        <View style={styles.doneBanner}>
          <Ionicons name="checkmark-circle" size={17} color="#2e7d32" />
          <Text style={styles.doneText}>{done}</Text>
        </View>
      ) : null}

      {/* ── Change your plan ─────────────────────────────────────── */}
      <Text style={[typography.h3, styles.sectionTitle]}>Change your plan</Text>
      <Text style={[typography.bodyMuted, styles.sectionSub]}>
        Upgrade any time (the unused part of your current plan is credited).
        Downgrades take effect when your current period ends.
      </Text>

      {membershipTiers.map((t) => {
        const rel = relationOf(t);
        const chip = RELATION_CHIP[rel];
        const isSel = selId === t.id;
        const monthly = t.periods.monthly;

        return (
          <Card key={t.id} style={[styles.tierCard, isSel && styles.tierCardSel]}>
            <View style={styles.tierTop}>
              <Text style={[typography.h3, { flex: 1 }]}>{t.name}</Text>
              <Badge label={chip.label} tone={chip.tone} />
            </View>

            <Text style={styles.tierPrice}>
              {monthly === 0 ? 'Free' : `from ${money(monthly ?? 0)}/mo`}
            </Text>

            <View style={styles.featureList}>
              {t.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.secondaryDark} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {rel === 'current' ? (
              <View style={styles.activeRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.activeText}>Active — renews {sub.current_period_end}</Text>
              </View>
            ) : (
              <PrimaryButton
                label={isSel ? 'Close' : rel === 'upgrade' ? 'Upgrade' : rel === 'downgrade' ? 'Downgrade' : 'Switch'}
                variant={isSel ? 'outline' : 'filled'}
                style={styles.tierCta}
                onPress={() => pickTier(t)}
              />
            )}

            {/* ── Period + quote ────────────────────────────────── */}
            {isSel && quote ? (
              <View style={styles.quoteBox}>
                <Text style={[typography.label, styles.quoteLabel]}>BILLING PERIOD</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
                  {periodsFor(t).map((p) => {
                    const on = period === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.periodChip, on && styles.periodChipOn]}
                        onPress={() => { setPeriod(p); setCredits(0); }}
                      >
                        <Text style={[styles.periodText, on && styles.periodTextOn]}>
                          {PERIOD_LABEL[p]}
                        </Text>
                        <Text style={[styles.periodPrice, on && styles.periodTextOn]}>
                          {money(t.periods[p] ?? 0)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {quote.scheduled ? (
                  // A mid-cycle downgrade isn't priced — it's scheduled.
                  <View style={styles.scheduleBox}>
                    <Ionicons name="time-outline" size={16} color={colors.warningDark} />
                    <Text style={styles.scheduleText}>
                      Downgrades aren't charged now. {t.name} starts on {sub.current_period_end},
                      when your current period ends. You keep {currentTier.name} until then.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.lineRow}>
                      <Text style={typography.bodyMuted}>{PERIOD_LABEL[period]} price</Text>
                      <Text style={styles.lineValue}>{money(quote.listPrice)}</Text>
                    </View>
                    {quote.credit > 0 ? (
                      <View style={styles.lineRow}>
                        <Text style={styles.creditLabel}>Proration credit</Text>
                        <Text style={styles.creditValue}>− {money(quote.credit)}</Text>
                      </View>
                    ) : null}

                    {maxCredit > 0 ? (
                      <>
                        <Text style={[typography.label, styles.quoteLabel]}>
                          HEALTH CREDITS — {healthCredits.available} available, up to {maxCredit} usable
                        </Text>
                        <View style={styles.creditRow}>
                          <TextInput
                            value={String(credits)}
                            onChangeText={(v) => setCredits(Math.min(maxCredit, Number(v.replace(/\D/g, '')) || 0))}
                            keyboardType="number-pad"
                            style={styles.creditInput}
                          />
                          <TouchableOpacity style={styles.maxBtn} onPress={() => setCredits(maxCredit)}>
                            <Text style={styles.maxText}>Use max</Text>
                          </TouchableOpacity>
                        </View>
                        {credits > 0 ? (
                          <View style={styles.lineRow}>
                            <Text style={styles.creditLabel}>Health credits</Text>
                            <Text style={styles.creditValue}>− {money(Math.min(credits, maxCredit))}</Text>
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    <View style={styles.divider} />
                    <View style={styles.lineRow}>
                      <Text style={typography.h3}>Pay now</Text>
                      <Text style={styles.payable}>{money(payable)}</Text>
                    </View>

                    <PrimaryButton
                      label={payable === 0 ? 'Activate' : `Pay ${money(payable)}`}
                      style={styles.payBtn}
                      onPress={() => {
                        setDone(`${t.name} is now active.`);
                        setSelId(null);
                      }}
                    />
                    <View style={styles.secureRow}>
                      <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                      <Text style={typography.caption}>Payments are processed securely</Text>
                    </View>
                  </>
                )}
              </View>
            ) : null}
          </Card>
        );
      })}

      <TouchableOpacity style={styles.cancelRow}>
        <Ionicons name="close-circle-outline" size={16} color={colors.error} />
        <Text style={styles.cancelText}>Cancel membership</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 16 },
  hero: { borderRadius: radius.lg, padding: 18, gap: 4, marginBottom: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: 6 },
  heroPrice: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)' },
  heroDiscount: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.sm, padding: 9, marginTop: 8 },
  heroDiscountText: { fontSize: 12, fontWeight: '700', color: colors.white },
  heroRenew: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  doneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F5E9',
    borderRadius: radius.sm, padding: 11, marginBottom: 16,
  },
  doneText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#2e7d32' },
  sectionTitle: { marginBottom: 4 },
  sectionSub: { marginBottom: 14 },
  tierCard: { marginBottom: 12, gap: 8 },
  tierCardSel: { borderColor: colors.primary, borderWidth: 2 },
  tierTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierPrice: { fontSize: 19, fontWeight: '800', color: colors.primary },
  featureList: { gap: 5, marginTop: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText: { flex: 1, fontSize: 12.5, color: colors.textSecondary },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  activeText: { fontSize: 12.5, fontWeight: '600', color: colors.success },
  tierCta: { marginTop: 6, height: 42 },
  quoteBox: {
    marginTop: 10, paddingTop: 12, gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  quoteLabel: { marginTop: 4 },
  periodRow: { gap: 8, paddingBottom: 4 },
  periodChip: {
    alignItems: 'center', gap: 1, paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  periodChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  periodPrice: { fontSize: 11, color: colors.textMuted },
  periodTextOn: { color: colors.white },
  scheduleBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.warningLight, borderRadius: radius.sm, padding: 11, marginTop: 4,
  },
  scheduleText: { flex: 1, fontSize: 12, color: colors.warningDark, lineHeight: 17 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineValue: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  creditLabel: { fontSize: 12.5, color: '#2e7d32' },
  creditValue: { fontSize: 13.5, fontWeight: '700', color: '#2e7d32' },
  creditRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  creditInput: {
    flex: 1, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 11, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  maxBtn: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  maxText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 },
  payable: { fontSize: 20, fontWeight: '800', color: colors.primary },
  payBtn: { marginTop: 8 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 2 },
  cancelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 18 },
  cancelText: { fontSize: 13, fontWeight: '600', color: colors.error },
});
