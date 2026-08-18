import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import {
  activeTier, Discount, findCoupon, inr, PaymentMethodKey, paymentMethods,
  Quote, razorpayModes, RESERVATION_MINUTES,
} from '../data/checkout';
import { healthCredits, wallet } from '../data/mock';
import { colors, radius, typography } from '../theme/theme';

/**
 * The settle step every product ends on — consultations, services, group
 * offerings, recovery plans and advanced care plans all land here.
 *
 * The breakdown follows the web's `price_breakdown` order exactly, so a
 * patient reading this and an admin reading the pricing table are looking at
 * the same arithmetic. The figures are still a preview: the web POSTs the
 * booking and reads the amount back off the Razorpay order the server creates,
 * and that server figure is the one that is charged.
 */

type Props = {
  quote: Quote;
  vouchers: Discount[];
  appliedVoucherIds: string[];
  onToggleVoucher: (id: string) => void;
  coupons: Discount[];
  onApplyCoupon: (c: Discount) => void;
  onRemoveCoupon: (id: string) => void;
  creditsApplied: number;
  onCreditsChange: (n: number) => void;
  method: PaymentMethodKey;
  onMethodChange: (m: PaymentMethodKey) => void;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  /** Shown as a reservation notice — the web holds the slot while you pay. */
  reserves?: boolean;
  /** What the consent line calls this purchase, e.g. "consultation", "plan". */
  consentNoun?: string;
};

export default function PaymentPanel({
  quote, vouchers, appliedVoucherIds, onToggleVoucher,
  coupons, onApplyCoupon, onRemoveCoupon,
  creditsApplied, onCreditsChange, method, onMethodChange,
  agreed, onAgreedChange, reserves = true, consentNoun = 'consultation',
}: Props) {
  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const walletShort = method === 'wallet' && wallet.balance < quote.total;

  const applyCode = () => {
    const found = findCoupon(code);
    if (!found) {
      setCouponError(`"${code.trim()}" isn't a valid coupon code.`);
      return;
    }
    if (coupons.some((c) => c.id === found.id)) {
      setCouponError('That coupon is already applied.');
      return;
    }
    onApplyCoupon(found);
    setCode('');
    setCouponError(null);
  };

  return (
    <View>
      {/* ── Price breakdown, in the server's own order ───────────── */}
      <Text style={styles.label}>Payment summary</Text>
      <Card style={styles.card}>
        <Row
          label="Base price"
          value={inr(quote.fee)}
          strike={quote.listPrice && quote.listPrice > quote.fee ? inr(quote.listPrice) : null}
        />
        {quote.incrementFixed > 0 ? (
          <Row label="Facility charge" value={`+ ${inr(quote.incrementFixed)}`} />
        ) : null}
        {quote.incrementPctAmount > 0 ? (
          <Row label={`Service charge (${quote.incrementPct}%)`} value={`+ ${inr(quote.incrementPctAmount)}`} />
        ) : null}

        {quote.overallDiscount > 0 ? (
          <>
            <View style={styles.divider} />
            <Row label="Subtotal" value={inr(quote.gross)} />
            <Row
              label={`Offering discount (${quote.overallDiscountPct}%)`}
              value={`− ${inr(quote.overallDiscount)}`}
              tone="good"
            />
          </>
        ) : null}

        <View style={styles.divider} />
        <Row label="Price" value={inr(quote.finalPrice)} bold />

        {quote.userDiscount > 0 ? (
          <Row
            label={`Your account discount (${quote.userDiscountPct}%)`}
            value={`− ${inr(quote.userDiscount)}`}
            tone="good"
          />
        ) : null}

        {quote.planDiscount > 0 ? (
          <Row
            label={`${activeTier?.name ?? 'Membership'} plan discount (${quote.planDiscountPct}%)`}
            value={`− ${inr(quote.planDiscount)}`}
            tone="good"
          />
        ) : null}

        {quote.voucherTotal > 0 ? (
          <Row label="Vouchers" value={`− ${inr(quote.voucherTotal)}`} tone="good" />
        ) : null}
        {quote.couponTotal > 0 ? (
          <Row label="Coupons" value={`− ${inr(quote.couponTotal)}`} tone="good" />
        ) : null}
        {quote.creditsApplied > 0 ? (
          <Row label="Health credits" value={`− ${inr(quote.creditsApplied)}`} tone="good" />
        ) : null}

        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={typography.h3}>Total payable</Text>
          <Text style={styles.total}>{inr(quote.total)}</Text>
        </View>
        {quote.total === 0 ? (
          <Text style={styles.freeNote}>Fully covered — nothing to pay.</Text>
        ) : null}
      </Card>

      {/* ── Vouchers: offered by the provider on this offering ───── */}
      {vouchers.length ? (
        <>
          <Text style={styles.label}>Vouchers on this booking</Text>
          <Card style={styles.card}>
            {vouchers.map((v) => {
              const on = appliedVoucherIds.includes(v.id);
              return (
                <TouchableOpacity key={v.id} style={styles.discRow} onPress={() => onToggleVoucher(v.id)} activeOpacity={0.7}>
                  <Ionicons
                    name={on ? 'checkbox' : 'square-outline'}
                    size={19}
                    color={on ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.discCode}>{v.code}</Text>
                    <Text style={typography.bodyMuted}>{v.label}</Text>
                  </View>
                  <Text style={styles.discAmt}>− {inr(v.amount)}</Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        </>
      ) : null}

      {/* ── Coupons: typed in by the patient ─────────────────────── */}
      <Text style={styles.label}>Have a coupon?</Text>
      <Card style={styles.card}>
        <View style={styles.couponRow}>
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t); setCouponError(null); }}
            placeholder="Enter coupon code"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.couponInput}
            onSubmitEditing={applyCode}
          />
          <TouchableOpacity
            style={[styles.applyBtn, !code.trim() && styles.applyBtnOff]}
            onPress={applyCode}
            disabled={!code.trim()}
          >
            <Text style={[styles.applyText, !code.trim() && styles.applyTextOff]}>Apply</Text>
          </TouchableOpacity>
        </View>

        {couponError ? (
          <View style={styles.errRow}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
            <Text style={styles.errText}>{couponError}</Text>
          </View>
        ) : null}

        {coupons.map((c) => (
          <View key={c.id} style={styles.appliedRow}>
            <Ionicons name="pricetag" size={14} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.discCode}>{c.code}</Text>
              <Text style={typography.caption}>{c.label}</Text>
            </View>
            <Text style={styles.discAmt}>− {inr(c.amount)}</Text>
            <TouchableOpacity onPress={() => onRemoveCoupon(c.id)} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* ── Health credits ───────────────────────────────────────── */}
      <Text style={styles.label}>Health credits</Text>
      <Card style={styles.card}>
        <View style={styles.creditHead}>
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>
              You have <Text style={styles.strong}>{healthCredits.available}</Text> credits
            </Text>
            <Text style={typography.bodyMuted}>
              Up to {healthCredits.max_redeemable_pct}% of this booking can be paid with credits.
            </Text>
          </View>
          <Switch
            value={creditsApplied > 0}
            onValueChange={(v) => onCreditsChange(v ? quote.maxCredits : 0)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            disabled={quote.maxCredits === 0}
          />
        </View>
        {quote.maxCredits === 0 ? (
          <Text style={typography.caption}>No credits can be applied to this booking.</Text>
        ) : creditsApplied > 0 ? (
          <View style={styles.appliedNote}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.appliedNoteText}>
              {quote.creditsApplied} credits applied — {inr(quote.creditsApplied)} off
            </Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => onCreditsChange(quote.maxCredits)}>
            <Text style={styles.useMax}>Use max ({quote.maxCredits} credits)</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* ── Method ───────────────────────────────────────────────── */}
      {quote.total > 0 ? (
        <>
          <Text style={styles.label}>Pay with</Text>
          {paymentMethods.map((m) => {
            const active = method === m.key;
            const short = m.key === 'wallet' && wallet.balance < quote.total;
            return (
              <TouchableOpacity
                key={m.key}
                activeOpacity={0.85}
                onPress={() => onMethodChange(m.key)}
                style={[styles.methodRow, active && styles.methodRowActive]}
              >
                <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                  <Ionicons name={m.icon} size={18} color={active ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{m.label}</Text>
                  <Text style={[typography.bodyMuted, short && styles.shortText]}>
                    {short ? `${m.sub} — short by ${inr(quote.total - wallet.balance)}` : m.sub}
                  </Text>
                  {/* Razorpay picks the instrument in its own sheet, so name
                      what it will offer rather than duplicating the choice. */}
                  {m.key === 'razorpay' && active ? (
                    <View style={styles.modeRow}>
                      {razorpayModes.map((r) => (
                        <View key={r.label} style={styles.modeChip}>
                          <Ionicons name={r.icon} size={11} color={colors.textSecondary} />
                          <Text style={styles.modeText}>{r.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          {walletShort ? (
            <Text style={styles.walletWarn}>
              Wallet balance won&apos;t cover this. Top up, or pay via Razorpay.
            </Text>
          ) : null}
        </>
      ) : null}

      {/* ── Terms + reservation ──────────────────────────────────── */}
      <TouchableOpacity style={styles.agreeRow} onPress={() => onAgreedChange(!agreed)} activeOpacity={0.7}>
        <Ionicons
          name={agreed ? 'checkbox' : 'square-outline'}
          size={19}
          color={agreed ? colors.primary : colors.textMuted}
        />
        <Text style={styles.agreeText}>
          I agree to the <Text style={styles.link}>Terms of Service</Text>,{' '}
          <Text style={styles.link}>Cancellation &amp; Refund policy</Text>, and consent to this{' '}
          {consentNoun} being recorded in my health record.
        </Text>
      </TouchableOpacity>

      {reserves ? (
        <View style={styles.reserveRow}>
          <Ionicons name="time-outline" size={13} color={colors.warningDark} />
          <Text style={styles.reserveText}>
            Your slot is held for {RESERVATION_MINUTES} minutes while you pay.
          </Text>
        </View>
      ) : null}

      {quote.total > 0 && method === 'razorpay' ? (
        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
          <Text style={typography.caption}>
            Secured by <Text style={styles.rzp}>Razorpay</Text> · your card details never reach us
          </Text>
        </View>
      ) : (
        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
          <Text style={typography.caption}>Payments are processed securely</Text>
        </View>
      )}
    </View>
  );
}

function Row({
  label, value, tone, strike, bold,
}: { label: string; value: string; tone?: 'good'; strike?: string | null; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[typography.bodyMuted, bold && styles.rowLabelBold]}>{label}</Text>
      <View style={styles.rowRight}>
        {strike ? <Text style={styles.strikeText}>{strike}</Text> : null}
        <Text style={[styles.rowValue, tone === 'good' && styles.rowValueGood]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginTop: 20, marginBottom: 8 },
  card: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabelBold: { fontWeight: '700', color: colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowValueGood: { color: colors.success },
  strikeText: { fontSize: 12.5, color: colors.textMuted, textDecorationLine: 'line-through' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 21, fontWeight: '800', color: colors.primary },
  freeNote: { fontSize: 12, fontWeight: '600', color: colors.success },

  discRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  discCode: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  discAmt: { fontSize: 13.5, fontWeight: '700', color: colors.success },

  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, fontWeight: '600', color: colors.textPrimary, letterSpacing: 0.4,
  },
  applyBtn: {
    paddingHorizontal: 18, justifyContent: 'center',
    borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  applyBtnOff: { backgroundColor: colors.border },
  applyText: { fontSize: 13, fontWeight: '800', color: colors.white },
  applyTextOff: { color: colors.textMuted },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errText: { flex: 1, fontSize: 12, color: colors.error },
  appliedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },

  creditHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strong: { fontWeight: '800', color: colors.textPrimary },
  useMax: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  appliedNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  appliedNoteText: { fontSize: 12.5, fontWeight: '600', color: colors.success },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 9,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  methodRowActive: { borderColor: colors.primary, borderWidth: 2 },
  methodIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F1FC',
    alignItems: 'center', justifyContent: 'center',
  },
  methodIconActive: { backgroundColor: colors.primary },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9, backgroundColor: colors.background,
  },
  modeText: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  shortText: { color: colors.error },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  walletWarn: { fontSize: 12, color: colors.error, marginBottom: 6 },

  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 18 },
  agreeText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '700' },

  reserveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    padding: 10, borderRadius: radius.sm, backgroundColor: '#FFF6E5',
  },
  reserveText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.warningDark },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 14 },
  rzp: { fontWeight: '800', color: '#3395FF' },
});
