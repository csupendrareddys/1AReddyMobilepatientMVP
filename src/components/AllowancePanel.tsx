import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import {
  ADD_ONS, AddOn, AddOnKey, Allowance, allowancesFor, dailyRemaining, remaining,
} from '../data/addons';
import { ServiceChannel, effectiveComms } from '../data/channels';
import { purchaseNote } from '../data/extensions';
import { inr } from '../data/checkout';
import { colors, radius, typography } from '../theme/theme';

/**
 * What this booking includes, what's left, and how to buy more.
 *
 * Shown inside the conversation and again on the booking, because the two
 * questions — "can I still message?" and "what did I actually buy?" — get
 * asked in both places.
 *
 * Running out never hides the care. It stays visible with a price against it,
 * so the patient can see the way forward rather than hitting a dead end.
 */
export default function AllowancePanel({
  channel, productName, compact = false,
}: { channel: ServiceChannel; productName?: string; compact?: boolean }) {
  const router = useRouter();
  const [buying, setBuying] = useState<AddOn | null>(null);
  const [bought, setBought] = useState<AddOnKey[]>([]);

  const rows = allowancesFor(channel);
  const caps = effectiveComms(channel);
  const name = productName ?? channel.serviceName;

  // An add-on is an ordinary product, so it settles through the same checkout
  // as everything else rather than a bespoke payment path. The channel travels
  // with it so checkout can credit the allowance once it's paid — otherwise
  // the patient buys 20 messages and the composer is still locked.
  const buy = (a: AddOn) => {
    setBought((b) => [...b, a.key]);
    setBuying(null);
    router.push({
      pathname: '/checkout',
      params: {
        kind: 'service',
        name: `${a.name} — ${name}`,
        price: String(a.price),
        provider: channel.counterparts[0]?.name ?? 'Your care team',
        meta: a.unit,
        addOn: a.key,
        channelId: channel.id,
      },
    } as never);
  };

  return (
    <View>
      <Card style={styles.card}>
        {rows.map((a) => {
          const left = remaining(a);
          const today = dailyRemaining(a);
          const out = left !== null && left <= 0;
          // A zero allowance means the purchase never included this, which is
          // a different thing from having spent it — "0 of 0 left" reads as a
          // bug rather than as an upsell.
          const notIncluded = a.total === 0;
          const dayOut = today !== null && today <= 0;
          const pct = a.total ? Math.min(1, a.used / a.total) : 0;

          return (
            <View key={a.key} style={styles.row}>
              <View style={styles.rowHead}>
                <Ionicons name={a.icon} size={15} color={a.tint} />
                <Text style={styles.rowLabel}>{a.label}</Text>
                <Text style={[
                  styles.rowCount,
                  out && !notIncluded && styles.rowCountOut,
                  notIncluded && styles.rowCountMuted,
                ]}>
                  {a.total == null ? 'Unlimited'
                    : notIncluded ? 'Not included'
                      : a.key === 'days'
                        // A term reads in days, and running out is "ended",
                        // not "0 left" — the plan is over, not just spent.
                        ? (left === 0 ? 'Plan has ended' : `${left} of ${a.total} days left`)
                        : `${left} of ${a.total} left`}
                </Text>
              </View>

              {a.total != null && !notIncluded ? (
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${pct * 100}%`, backgroundColor: out ? colors.error : a.tint },
                    ]}
                  />
                </View>
              ) : null}

              {/* Once the term allowance is gone, today's remainder is not the
                  reason they can't send — showing it would just contradict the
                  line above. */}
              {a.subTotal != null && !out ? (
                <Text style={[styles.sub, dayOut && styles.subOut]}>
                  {dayOut
                    ? `Daily limit reached — ${a.subTotal} a day. Resets tomorrow.`
                    : `${today} of ${a.subTotal} left today`}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.topUp}
                onPress={() => setBuying(ADD_ONS[a.key])}
              >
                <Ionicons name="add-circle-outline" size={13} color={colors.primary} />
                <Text style={styles.topUpText}>
                  {notIncluded ? 'Buy' : 'Add'} {ADD_ONS[a.key].unit} · {inr(ADD_ONS[a.key].price)}
                </Text>
                {bought.includes(a.key) ? (
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}

        {!rows.length ? (
          <Text style={typography.bodyMuted}>
            This booking doesn&apos;t include messaging or calls.
          </Text>
        ) : null}
      </Card>

      {/* Emergency sits apart from the top-ups: it isn't about running out of
          an allowance, it's about needing someone now. */}
      {caps.emergencyEnabled ? (
        <TouchableOpacity
          style={styles.emergency}
          activeOpacity={0.85}
          onPress={() => setBuying(ADD_ONS.emergency)}
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="medkit" size={19} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Need a doctor now?</Text>
            <Text style={styles.emergencySub}>
              Emergency call within 30 minutes · {inr(ADD_ONS.emergency.price)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      {compact ? null : (
        <Text style={[typography.caption, styles.note]}>
          Add-ons apply to this booking only and last as long as it does.
        </Text>
      )}

      <AppModal visible={!!buying} onClose={() => setBuying(null)} title={buying?.name ?? ''}>
        {buying ? (
          <>
            <View style={[styles.modalIcon, { backgroundColor: `${buying.tint}1A` }]}>
              <Ionicons name={buying.icon} size={30} color={buying.tint} />
            </View>
            <Text style={[typography.h2, styles.modalUnit]}>{buying.unit}</Text>
            <Text style={typography.body}>{buying.description}</Text>

            {/* Where the booking goes after this purchase — told before the
                payment, so finding it afterwards is never a surprise. */}
            <View style={styles.whereRow}>
              <Ionicons name="arrow-redo-outline" size={15} color={colors.primary} />
              <Text style={styles.whereText}>{purchaseNote(buying.key, buying.unit, channel.id)}</Text>
            </View>

            {buying.key === 'emergency' ? (
              <View style={styles.warnRow}>
                <Ionicons name="warning-outline" size={15} color={colors.warningDark} />
                <Text style={styles.warnText}>
                  This is not a substitute for emergency services. If someone is
                  in immediate danger, call your local emergency number.
                </Text>
              </View>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={typography.bodyMuted}>You&apos;ll pay</Text>
              <Text style={styles.price}>{inr(buying.price)}</Text>
            </View>

            <PrimaryButton
              label={`Continue · ${inr(buying.price)}`}
              style={styles.modalBtn}
              onPress={() => buy(buying)}
            />
            <PrimaryButton
              label="Not now"
              variant="outline"
              style={styles.modalBtnAlt}
              onPress={() => setBuying(null)}
            />
          </>
        ) : null}
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  row: { gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  rowCount: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  rowCountOut: { color: colors.error },
  rowCountMuted: { color: colors.textMuted, fontWeight: '600' },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  sub: { fontSize: 11, color: colors.textMuted },
  subOut: { color: colors.warningDark, fontWeight: '700' },
  topUp: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingTop: 2 },
  topUpText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  emergency: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 12,
    borderRadius: radius.md, backgroundColor: colors.error,
  },
  emergencyIcon: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  emergencyTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  emergencySub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  note: { marginTop: 10 },

  modalIcon: {
    width: 60, height: 60, borderRadius: 30, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  modalUnit: { textAlign: 'center', marginBottom: 8 },
  whereRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12,
    padding: 11, borderRadius: radius.sm, backgroundColor: '#E8F1FC',
  },
  whereText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.primary, fontWeight: '600' },
  warnRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 14,
    padding: 11, borderRadius: radius.sm, backgroundColor: '#FFF6E5',
  },
  warnText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.warningDark },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  price: { fontSize: 22, fontWeight: '800', color: colors.primary },
  modalBtn: { marginTop: 18 },
  modalBtnAlt: { marginTop: 10 },
});
