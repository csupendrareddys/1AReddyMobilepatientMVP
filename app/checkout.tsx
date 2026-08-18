import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import Stepper from '../src/components/Stepper';
import PrimaryButton from '../src/components/PrimaryButton';
import PaymentPanel from '../src/components/PaymentPanel';
import MedicalRecordsShare, { emptyShare } from '../src/components/MedicalRecordsShare';
import { summarise } from '../src/data/visitVitals';
import PersonSelector from '../src/components/PersonSelector';
import { findPerson, peopleFor, SELF_ID } from '../src/data/people';
import {
  Discount, inr, PaymentMethodKey, PRODUCT_LABEL, ProductKind, quoteFor, vouchersFor,
} from '../src/data/checkout';
import {
  channelById, grantAddOn, isTeamProduct, productHasChat, serviceChannels,
} from '../src/data/channels';
import { destinationOf, recordExtension } from '../src/data/extensions';
import { colors, radius, typography } from '../src/theme/theme';

const STEPS = ['Review', 'Records', 'Pay'];

/**
 * One checkout for every non-appointment product — services, group offerings,
 * recovery plans and advanced care plans. They differ only in what they're
 * called and what they cost, so they share a screen rather than each growing
 * their own drift-prone copy of the same three steps.
 *
 * Appointments keep their own flow because they add slot selection.
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string; name?: string; price?: string; provider?: string;
    meta?: string; listPrice?: string; installments?: string;
    /** Set when this is a top-up bought against an existing conversation. */
    addOn?: string; channelId?: string;
    /** 'records' opens on the Records step — plan products from a product
        page have nothing left to review. */
    start?: string;
  }>();

  const kind = (params.kind ?? 'service') as ProductKind;
  const name = params.name ?? 'Product';
  const price = Number(params.price ?? 0);
  const listPrice = params.listPrice ? Number(params.listPrice) : null;
  const provider = params.provider ?? '';
  const meta = params.meta ?? '';
  const installments = Number(params.installments ?? 0);

  // A top-up against an open conversation: extra messages, an extra call, or
  // an emergency call. It has to be credited to that channel when it's paid,
  // or the patient buys an allowance that never arrives.
  const addOn = (params.addOn ?? null) as 'chat' | 'video' | 'audio' | 'days' | 'emergency' | null;
  const addOnChannel = params.channelId ? channelById(params.channelId) : null;

  // A communication-enabled product opens its channel(s) the moment it's
  // bought. Recovery plans run like services (one thread with the provider);
  // longevity and advanced plans run like group offerings (a team thread plus
  // a private leg with each member).
  const hasChat = productHasChat(kind);
  const key = name.split('—')[0].trim().toLowerCase().slice(0, 12);
  const opened = hasChat
    ? serviceChannels.filter((c) => c.serviceName.toLowerCase().includes(key))
    : [];
  const primaryChannel = opened.find((c) => c.kind === 'group') ?? opened[0] ?? null;

  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'appt_booking', verb: 'manage' });
  const [personId, setPersonId] = useState(SELF_ID);
  const patient = findPerson(people, personId);

  const [step, setStep] = useState(params.start === 'records' ? 1 : 0);
  const [share, setShare] = useState(emptyShare());
  const [confirmed, setConfirmed] = useState(false);

  const vouchers = useMemo(() => vouchersFor(kind), [kind]);
  const [voucherIds, setVoucherIds] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Discount[]>([]);
  const [credits, setCredits] = useState(0);
  const [method, setMethod] = useState<PaymentMethodKey>('razorpay');
  const [agreed, setAgreed] = useState(false);

  const quote = quoteFor({
    fee: price,
    listPrice,
    overallDiscountPct: 5,
    vouchers: vouchers.filter((v) => voucherIds.includes(v.id)),
    coupons,
    creditsApplied: credits,
  });

  // Plans bill in instalments — the first one is what's due today.
  const dueNow = installments > 1 ? Math.round(quote.total / installments) : quote.total;

  // A top-up isn't a new booking — it goes back where it was bought, with the
  // allowance it just added stated plainly.
  if (confirmed && addOn && addOnChannel) {
    const added = addOn === 'chat' ? '20 messages'
      : addOn === 'video' ? '1 video call'
        : addOn === 'audio' ? '1 voice call'
          : addOn === 'days' ? '30 more days'
            : 'an emergency call';
    return (
      <ScreenWrapper scroll={false} contentStyle={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </View>
        <Text style={[typography.h1, styles.successTitle]}>Added to your conversation</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>{added} · {addOnChannel.title}</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>
          {dueNow === 0 ? 'Fully covered' : `${inr(dueNow)} paid`}
        </Text>
        <Text style={[typography.caption, styles.successSub]}>
          {addOn === 'emergency'
            ? 'An on-call doctor will join within 30 minutes.'
            : `Available straight away. Find this under ${destinationOf(addOnChannel.id).label}.`}
        </Text>
        <PrimaryButton
          label="Back to the conversation"
          style={styles.successBtn}
          onPress={() => router.replace(`/channel/${addOnChannel.id}` as never)}
        />
        <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  if (confirmed) {
    return (
      <ScreenWrapper scroll={false} contentStyle={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </View>
        <Text style={[typography.h1, styles.successTitle]}>
          {kind === 'recovery_plan' || kind === 'advanced_plan' ? 'Plan started' : 'Booking confirmed'}
        </Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>{name}</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>For {patient.name}</Text>
        <Text style={[typography.bodyMuted, styles.successSub]}>
          {dueNow === 0 ? 'Fully covered' : `${inr(dueNow)} paid`}
          {installments > 1 ? ` · instalment 1 of ${installments}` : ''}
        </Text>
        <Text style={[typography.caption, styles.successSub]}>
          {share.share ? 'Your selected records were shared.' : 'No medical records were shared.'}
        </Text>
        {hasChat && primaryChannel ? (
          <View style={styles.chatNote}>
            <Ionicons name="chatbubbles" size={16} color={colors.primary} />
            <Text style={styles.chatNoteText}>
              {opened.length > 1
                ? `${opened.length} conversations are now open — a ${isTeamProduct(kind) ? 'care team' : 'group'} thread and a private one with each provider.`
                : 'Chat, calls and document exchange with your provider are now open.'}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label="View booking details"
          style={styles.successBtn}
          onPress={() => router.replace({
            pathname: '/booking-detail',
            params: {
              kind,
              name,
              provider,
              patient: patient.name,
              status: installments > 1 ? 'in_progress' : 'confirmed',
              amount: String(dueNow),
              paid: 'true',
              records: String(share.share),
              attachments: String(share.attachments.length),
              installments: String(installments),
              installmentsPaid: installments > 1 ? '1' : '0',
              channelId: primaryChannel ? primaryChannel.id : '',
              ref: 'LZ-9207',
            },
          } as never)}
        />

        {hasChat && primaryChannel ? (
          <PrimaryButton
            label={opened.length > 1 ? 'Open conversations' : 'Open conversation'}
            variant="outline"
            style={styles.successBtnAlt}
            onPress={() => router.replace(opened.length > 1 ? '/channels' : `/channel/${primaryChannel.id}`)}
          />
        ) : (
          <PrimaryButton
            label="Go to My Bookings"
            variant="outline"
            style={styles.successBtnAlt}
            onPress={() => router.replace('/(tabs)/appointments?view=in_progress')}
          />
        )}
        <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home-outline" size={15} color={colors.primary} />
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  const canContinue = step === 2 ? agreed : true;

  // A top-up skips the Records step: it's bought against a booking whose
  // provider already has whatever was shared, so asking again is noise.
  const steps = addOn ? ['Review', 'Pay'] : STEPS;
  const shownStep = addOn && step === 2 ? 1 : step;
  const goNext = () => setStep(addOn && step === 0 ? 2 : step + 1);
  const goBack = () => setStep(addOn && step === 2 ? 0 : step - 1);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader
        title={addOn ? 'Add to this booking' : `Book ${PRODUCT_LABEL[kind].toLowerCase()}`}
      />

      <Stepper
        steps={steps}
        current={shownStep}
        onStep={(i) => setStep(addOn && i === 1 ? 2 : i)}
        canNext={canContinue}
      />

      <PersonSelector label="Patient" people={people} value={personId} onChange={setPersonId} />

      <Card style={styles.productCard}>
        <View style={styles.productTop}>
          <Text style={[typography.h3, { flex: 1 }]}>{name}</Text>
          <Badge label={PRODUCT_LABEL[kind]} tone="neutral" />
        </View>
        {provider ? <Text style={typography.bodyMuted}>{provider}</Text> : null}
        {meta ? <Text style={typography.caption}>{meta}</Text> : null}
        <View style={styles.priceRow}>
          {listPrice && listPrice > price ? (
            <Text style={styles.strike}>{inr(listPrice)}</Text>
          ) : null}
          <Text style={styles.price}>{price === 0 ? 'Free' : inr(price)}</Text>
        </View>
      </Card>

      {step === 0 ? (
        <>
          <Text style={styles.label}>What&apos;s included</Text>
          <Card style={styles.card}>
            {includedFor(kind).map((line) => (
              <View key={line} style={styles.incRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[typography.body, { flex: 1 }]}>{line}</Text>
              </View>
            ))}
          </Card>

          {installments > 1 ? (
            <>
              <Text style={styles.label}>Payment schedule</Text>
              <Card style={styles.card}>
                <Text style={typography.body}>
                  Billed in <Text style={styles.strong}>{installments} instalments</Text> of about{' '}
                  {inr(Math.round(price / installments))}.
                </Text>
                <Text style={typography.bodyMuted}>
                  Only the first is due today. The rest are collected as the plan progresses.
                </Text>
              </Card>
            </>
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <MedicalRecordsShare
          value={share}
          onChange={setShare}
          patientName={patient.name.split(' ')[0]}
          scopeKind={personId === SELF_ID ? 'self' : 'minor'}
          scopeId={personId === SELF_ID ? null : personId}
        />
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.label}>Order summary</Text>
          <Card style={styles.card}>
            <SummaryRow label="Patient" value={patient.name} />
            <SummaryRow label="Product" value={name} />
            <SummaryRow label="Category" value={PRODUCT_LABEL[kind]} />
            {provider ? <SummaryRow label="Provider" value={provider} /> : null}
            <SummaryRow
              label="Records shared"
              value={share.share ? 'Yes — selected items' : 'No'}
            />
            {summarise(share.vitals, share.customVitals).length ? (
              <SummaryRow
                label="Vitals"
                value={summarise(share.vitals, share.customVitals).join(' · ')}
              />
            ) : null}
          </Card>

          <PaymentPanel
            quote={quote}
            vouchers={vouchers}
            appliedVoucherIds={voucherIds}
            onToggleVoucher={(id) => setVoucherIds((s) =>
              s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
            coupons={coupons}
            onApplyCoupon={(c) => setCoupons((s) => [...s, c])}
            onRemoveCoupon={(id) => setCoupons((s) => s.filter((c) => c.id !== id))}
            creditsApplied={credits}
            onCreditsChange={setCredits}
            method={method}
            onMethodChange={setMethod}
            agreed={agreed}
            onAgreedChange={setAgreed}
            reserves={kind === 'group_offering'}
            consentNoun={PRODUCT_LABEL[kind].toLowerCase()}
          />

          {installments > 1 && quote.total > 0 ? (
            <Card style={styles.dueCard}>
              <Text style={typography.bodyMuted}>Due today (instalment 1 of {installments})</Text>
              <Text style={styles.dueValue}>{inr(dueNow)}</Text>
            </Card>
          ) : null}
        </>
      ) : null}

      <View style={styles.navRow}>
        {step > 0 ? (
          <PrimaryButton label="Back" variant="outline" style={styles.navBtn} onPress={goBack} />
        ) : null}
        <PrimaryButton
          label={step === 2
            ? (dueNow === 0 ? 'Confirm' : `Pay ${inr(dueNow)}`)
            : step === 1 ? (share.share ? 'Continue with sharing' : 'Skip & continue')
              : 'Continue'}
          disabled={!canContinue}
          style={styles.navBtn}
          onPress={() => {
            if (step !== 2) return goNext();
            // Credit the allowance at the moment it's paid for, and record
            // the extension — that record is what pulls the booking back into
            // "In progress" so the patient can find what they just bought.
            if (addOn && params.channelId) {
              grantAddOn(params.channelId, addOn);
              recordExtension(params.channelId, addOn, meta || addOn);
            }
            return setConfirmed(true);
          }}
        />
      </View>
    </ScreenWrapper>
  );
}

const includedFor = (kind: ProductKind): string[] => {
  switch (kind) {
    case 'recovery_plan':
      return [
        'Day-by-day recovery schedule',
        'Daily check-ins from your care team',
        'Medicines and diet plan for the full duration',
        'Unlimited chat with the assigned doctor',
      ];
    case 'advanced_plan':
      return [
        'Dedicated multi-speciality care team',
        'Scheduled consultations across the plan',
        'All investigations and reports tracked in one place',
        'Care coordinator on call',
      ];
    case 'group_offering':
      return [
        'Live group session with the provider',
        'Session recording and notes afterwards',
        'Q&A with the facilitator',
      ];
    default:
      return [
        'Delivered by a verified provider',
        'Report uploaded to your health record',
        'Free rescheduling up to 24 hours before',
      ];
  }
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.body, styles.sumValue]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: { marginBottom: 6, gap: 4 },
  productTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  strike: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { ...typography.label, marginTop: 20, marginBottom: 8 },
  card: { gap: 10 },
  incRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  strong: { fontWeight: '800', color: colors.textPrimary },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  sumValue: { flex: 1, textAlign: 'right', fontWeight: '600' },
  dueCard: { marginTop: 14, gap: 2 },
  dueValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  navBtn: { flex: 1 },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: 20, textAlign: 'center' },
  successSub: { marginTop: 6, textAlign: 'center' },
  successBtn: { marginTop: 22, width: 250 },
  successBtnAlt: { marginTop: 10, width: 250 },
  chatNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18,
    padding: 12, borderRadius: radius.sm, backgroundColor: '#E8F1FC', maxWidth: 320,
  },
  chatNoteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.primary, fontWeight: '600' },
  homeLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18 },
  homeLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
