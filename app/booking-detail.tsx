import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import AppModal from '../src/components/AppModal';
import PrimaryButton from '../src/components/PrimaryButton';
import { inr, PRODUCT_LABEL, ProductKind } from '../src/data/checkout';
import {
  appendMessage, attachDocument, channelForProduct, effectiveComms, isTeamProduct,
  callLabel, messagesLeft, orderedCalls, SECOND_OPINION_COMMS,
  SECOND_OPINION_WINDOW_DAYS, secondOpinionChannel, serviceChannels,
} from '../src/data/channels';
import { careDocsFor, prescriptionsFor } from '../src/data/careDocs';
import AllowancePanel from '../src/components/AllowancePanel';
import SharedRecordsPanel from '../src/components/SharedRecordsPanel';
import { usePatientScope } from '../src/scope/PatientScope';
import { grantRecordsAccess, hasRecordsAccess, revokeRecordsAccess } from '../src/data/recordsAccess';
import { extensionsFor } from '../src/data/extensions';
import AttachSheet from '../src/components/AttachSheet';
import VisitVitalsSheet from '../src/components/VisitVitalsSheet';
import { CustomVital, VisitVitals, summarise } from '../src/data/visitVitals';
import { colors, radius, typography } from '../src/theme/theme';

/**
 * One booking, whatever kind of product it is.
 *
 * The web drives every control off (status × product type), and so does this:
 * an unpaid booking offers Pay, a live online consult offers Join, a completed
 * one offers the prescription and a rating, and a communication-enabled
 * service offers its channel. Controls that don't apply are absent rather than
 * disabled-and-mysterious.
 */

type Status =
  | 'pending' | 'pending_payment' | 'confirmed' | 'in_progress'
  | 'completed' | 'cancelled' | 'rejected';

const STATUS_META: Record<Status, { label: string; tone: 'warning' | 'primary' | 'success' | 'neutral' }> = {
  pending: { label: 'Awaiting confirmation', tone: 'warning' },
  rejected: { label: 'Declined by provider', tone: 'neutral' },
  pending_payment: { label: 'Pending payment', tone: 'warning' },
  confirmed: { label: 'Upcoming', tone: 'primary' },
  in_progress: { label: 'In progress', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** consultation type → what the Join button says. */
const JOIN_LABEL: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  video: { label: 'Join video call', icon: 'videocam' },
  audio: { label: 'Join audio call', icon: 'call' },
  phone: { label: 'Join audio call', icon: 'call' },
  chat: { label: 'Open chat consult', icon: 'chatbubbles' },
  in_person: { label: 'Clinic visit', icon: 'business' },
  home_visit: { label: 'Home visit', icon: 'home' },
  camp: { label: 'Camp visit', icon: 'flag' },
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    kind?: string; name?: string; provider?: string; patient?: string;
    date?: string; time?: string; status?: string; consultType?: string;
    amount?: string; paid?: string; records?: string; attachments?: string;
    installments?: string; installmentsPaid?: string; channelId?: string; slotMinutes?: string;
    awaiting?: string;
    bookedBy?: string; symptoms?: string; ref?: string; completedOn?: string;
  }>();

  const kind = (p.kind ?? 'appointment') as ProductKind;
  const status = (p.status ?? 'confirmed') as Status;
  const meta = STATUS_META[status] ?? STATUS_META.confirmed;
  const consultType = p.consultType ?? 'video';
  const amount = Number(p.amount ?? 0);
  const paid = p.paid !== 'false';
  const installments = Number(p.installments ?? 0);
  const installmentsPaid = Number(p.installmentsPaid ?? 0);
  // What the flow decided, corrected by anything granted or withdrawn since.
  // The ref is the row id uppercased, so normalise before asking the store.
  const storeKey = (p.ref ?? '').toLowerCase();
  const sharedRecords = storeKey
    ? hasRecordsAccess(storeKey)
    : p.records === 'true';

  // A channel exists for anything delivered over time — a service, a recovery
  // plan, a group offering or a longevity/advanced plan. Reached here from the
  // bookings list there's no channel id, so fall back to matching the product.
  // Every delivered product resolves to a channel — an existing thread where
  // there is one, otherwise one built from the product's own terms — so the
  // execution surface is identical whichever booking you open.
  const channel = p.channelId
    ? serviceChannels.find((c) => c.id === p.channelId) ?? null
    : channelForProduct(
      kind, p.name ?? '', p.provider,
      p.slotMinutes ? Number(p.slotMinutes) : undefined,
      (p.status ?? 'confirmed') === 'in_progress',
    );
  const siblingCount = channel?.groupId
    ? serviceChannels.filter((c) => c.groupId === channel.groupId).length
    : 0;

  // Everything the provider sent over the life of this booking, wherever it
  // was uploaded from.
  const careDocs = careDocsFor({ name: p.name, channel });

  /**
   * The follow-up thread that stays open after this booking finishes.
   *
   * The questions that matter most often arrive after the consultation ends —
   * once the patient is home with the prescription in hand. A few free
   * messages for a bounded window covers that, and anything more (a call, more
   * messages) is bought rather than refused.
   */
  const daysSinceCompletion = (() => {
    // The finish date if the list knew one. `date` is a display string — for a
    // plan it reads "Paid ₹x of ₹y" — so parsing it gave zero days and every
    // finished plan looked like it had a full free window left.
    const then = Date.parse(p.completedOn || p.date || '');
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.round((Date.parse('2026-08-18') - then) / 86_400_000));
  })();
  const followUp = secondOpinionChannel({
    bookingId: p.ref ?? `${p.name}-${p.date}`,
    doctorName: p.provider ?? 'Your doctor',
    productName: p.name ?? 'this booking',
    role: 'Treating doctor',
    daysSinceCompletion,
  });
  const followUpOpen = followUp.daysLeft > 0;
  // A product delivered over time can have a call running right now — the
  // patient shouldn't have to go hunting through the chat to find it.
  const liveCall = channel?.calls.find((c) => c.status === 'in_progress')
    ?? channel?.calls.find((c) => c.joinable)
    ?? null;
  const nextCall = channel?.calls.find((c) => c.status === 'scheduled' || c.status === 'accepted') ?? null;

  // Documents and the reason for the visit belong to the booking at every
  // stage — before it's accepted, while it runs, and after it's finished.
  const [docs, setDocs] = useState<{ name: string; note: string }[]>([]);
  const [docOpen, setDocOpen] = useState(false);

  // Whether the provider can see the health record. Seeded from what was
  // chosen at booking, and changeable here at any stage.
  const [sharing, setSharing] = useState(sharedRecords);
  // Whose record is on offer — a booking made for a minor must never list the
  // guardian's history.
  const { scope } = usePatientScope();

  // Readings taken because of this booking — kept on the booking, not written
  // into the standing health record.
  const [vitals, setVitals] = useState<VisitVitals>({});
  const [customVitals, setCustomVitals] = useState<CustomVital[]>([]);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const vitalLines = summarise(vitals, customVitals);

  const [reason, setReason] = useState(p.symptoms ?? '');
  const [reasonOpen, setReasonOpen] = useState(false);

  /**
   * Reset when the screen is reused for a different booking.
   *
   * expo-router keeps this screen mounted and swaps the params, so without
   * this, opening booking B after booking A shows A's consent, A's documents
   * and A's vitals against B — the sort of bug that quietly attributes one
   * patient's readings to another appointment.
   */
  const bookingKey = p.ref ?? `${p.name}-${p.date}-${p.time}`;
  useEffect(() => {
    setSharing(sharedRecords);
    setDocs([]);
    setVitals({});
    setCustomVitals([]);
    setReason(p.symptoms ?? '');
  }, [bookingKey, sharedRecords]);
  const [reasonDraft, setReasonDraft] = useState('');

  const [refundChoice, setRefundChoice] = useState<'wallet' | 'source' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const effectiveStatus: Status = cancelled ? 'cancelled' : status;

  // A finished or cancelled booking has no live surface: no call to join and
  // no conversation to open. The thread still exists — it just belongs to
  // Messages now, not to an action button on a closed booking.
  // A pending booking has no live surface either — there's nothing to join or
  // message until the provider has agreed to take it on.
  const isLive = effectiveStatus === 'confirmed'
    || effectiveStatus === 'in_progress'
    || effectiveStatus === 'pending_payment';
  // Anything still ahead of the patient can be added to; a finished or
  // declined booking can't.
  const canEditVisit = isLive || effectiveStatus === 'pending';

  /**
   * A call the patient bought as an add-on — from this page or the follow-up.
   * A purchased call is joinable whatever head the booking sits under: paying
   * for a call and then being told the booking is "completed" is a dead end.
   */
  const purchasedCall = [
    ...extensionsFor(followUp.id),
    ...(channel ? extensionsFor(channel.id) : []),
  ].find((e) => e.key === 'video' || e.key === 'audio') ?? null;

  /** Whether the consult's one call can be joined right now. */
  const joinActive = !!liveCall || !!purchasedCall;

  /** A plan's scheduled calls, in order; the first live-or-upcoming is next. */
  const planCalls = kind !== 'appointment' && channel ? orderedCalls(channel.calls) : [];
  const nextPlanIdx = planCalls.findIndex(
    (c) => c.status === 'in_progress' || c.status === 'scheduled' || c.status === 'accepted',
  );
  /**
   * The one call the patient is actually waiting for.
   *
   * A plan books several calls, so a bare list makes the patient read every
   * row and work out which one is still ahead of them. Naming it — "Intro
   * call 2, Tuesday" — answers the question the card is opened to answer.
   */
  const nextPlanCall = nextPlanIdx >= 0 ? planCalls[nextPlanIdx] : null;
  /**
   * Whether the plan's schedule is still meaningful.
   *
   * A completed or cancelled booking reached through a bought add-on call has
   * no next call — announcing one would promise care the plan no longer
   * covers.
   */
  const showSchedule = planCalls.length > 0
    && (isLive || effectiveStatus === 'pending');
  const nextPlanLive = !!nextPlanCall
    && (nextPlanCall.status === 'in_progress' || nextPlanCall.joinable);
  const join = JOIN_LABEL[consultType] ?? JOIN_LABEL.video;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Booking details" fallback="/(tabs)/appointments" />

      {/* ── Headline ─────────────────────────────────────────────── */}
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>{p.name ?? 'Booking'}</Text>
            {p.provider ? <Text style={typography.bodyMuted}>{p.provider}</Text> : null}
          </View>
          <Badge label={meta.label} tone={meta.tone} />
        </View>

        <View style={styles.chipRow}>
          <Chip icon="pricetag-outline" label={PRODUCT_LABEL[kind]} />
          {kind === 'appointment' ? (
            <Chip icon={join.icon} label={consultType.replace('_', ' ')} />
          ) : null}
          {p.ref ? <Chip icon="barcode-outline" label={p.ref} /> : null}
        </View>
      </Card>

      {/* ── When & who ───────────────────────────────────────────── */}
      <Text style={styles.label}>Details</Text>
      <Card style={styles.card}>
        {p.date ? <Row icon="calendar-outline" label="Date" value={p.date} /> : null}
        {p.time ? <Row icon="time-outline" label="Time" value={p.time} /> : null}
        <Row icon="person-outline" label="Patient" value={p.patient ?? 'You'} />
        {/* Accountability: only shown when someone other than the patient
            initiated it, so a normal self-booking stays uncluttered. */}
        {p.bookedBy ? (
          <Row icon="people-outline" label="Booked by" value={p.bookedBy} />
        ) : null}
        {p.symptoms ? <Row icon="pulse-outline" label="Symptoms" value={p.symptoms} /> : null}
        <Row
          icon={sharedRecords ? 'shield-checkmark-outline' : 'shield-outline'}
          label="Records shared"
          value={sharedRecords ? 'Yes — see below' : 'No'}
        />
        {p.attachments && Number(p.attachments) > 0 ? (
          <Row icon="attach-outline" label="Attachments" value={`${p.attachments} file(s)`} />
        ) : null}
      </Card>

      {/* ── What you can do now ──────────────────────────────────── */}
      {/* Paying doesn't confirm a booking — the provider still has to accept
          it. Saying so plainly stops a patient turning up to something that
          was never agreed. */}
      {effectiveStatus === 'pending' ? (
        <Card style={styles.pendingCard}>
          <View style={styles.pendingTop}>
            <View style={styles.pendingIcon}>
              <Ionicons name="hourglass-outline" size={19} color={colors.warningDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>
                {p.awaiting === 'payment'
                  ? 'Waiting for your payment'
                  : 'Waiting for the provider to accept'}
              </Text>
              <Text style={typography.bodyMuted}>
                {p.awaiting === 'payment'
                  ? 'This booking is held until payment clears.'
                  : `${p.provider || 'The provider'} usually responds within 12 hours. `
                    + 'You’ll be notified either way.'}
              </Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            {['Pending', 'Upcoming', 'In progress', 'Completed'].map((st, i) => (
              <React.Fragment key={st}>
                {i ? <View style={styles.stepLine} /> : null}
                <Text style={[styles.stepText, i === 0 && styles.stepTextOn]}>{st}</Text>
              </React.Fragment>
            ))}
          </View>
          {amount > 0 ? (
            <Text style={styles.pendingNote}>
              {inr(amount)} is held, not charged. If the provider declines, it comes
              straight back to you.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* A declined booking owes the patient a decision about their money. */}
      {effectiveStatus === 'rejected' ? (
        <>
          <Card style={styles.rejectCard}>
            <View style={styles.pendingTop}>
              <View style={styles.rejectIcon}>
                <Ionicons name="close-circle-outline" size={19} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{p.provider || 'The provider'} declined this booking</Text>
                <Text style={typography.bodyMuted}>
                  They may be unavailable or unable to take this case. You have
                  not been charged for the consultation.
                </Text>
              </View>
            </View>
            {amount > 0 ? (
              <View style={styles.refundRow}>
                <Text style={typography.bodyMuted}>Amount to return</Text>
                <Text style={styles.refundAmount}>{inr(amount)}</Text>
              </View>
            ) : null}
          </Card>

          {refundChoice ? (
            <Card style={styles.refundDone}>
              <Ionicons name="checkmark-circle" size={19} color={colors.success} />
              <Text style={[typography.body, { flex: 1 }]}>
                {refundChoice === 'source'
                  ? `${inr(amount)} is on its way back to your original payment method. `
                    + 'It usually lands within 5–7 working days.'
                  : `${inr(amount)} has been added to your wallet. You can use it `
                    + 'to book someone else straight away.'}
              </Text>
            </Card>
          ) : (
            <>
              <Text style={styles.label}>How would you like your money back?</Text>
              <TouchableOpacity
                style={styles.refundOption}
                activeOpacity={0.85}
                onPress={() => setRefundChoice('wallet')}
              >
                <View style={[styles.refundIcon, { backgroundColor: '#E8F1FC' }]}>
                  <Ionicons name="wallet-outline" size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>Add to my wallet</Text>
                  <Text style={typography.bodyMuted}>
                    Available immediately — rebook with another provider today.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refundOption}
                activeOpacity={0.85}
                onPress={() => setRefundChoice('source')}
              >
                <View style={[styles.refundIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name="card-outline" size={19} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>Refund to original payment</Text>
                  <Text style={typography.bodyMuted}>
                    Back to the card or account you paid from, in 5–7 working days.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}

          <PrimaryButton
            label="Find another provider"
            variant={refundChoice ? 'filled' : 'outline'}
            style={styles.action}
            onPress={() => router.push('/(tabs)/find-care')}
          />
        </>
      ) : null}

      {/* ── Reason for the visit ─────────────────────────────────── */}
      <View style={styles.sectionHead}>
        <Text style={[styles.label, styles.sectionLabel]}>Reason for this appointment</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setReasonDraft(reason); setReasonOpen(true); }}
        >
          <Ionicons name={reason ? 'create-outline' : 'add-circle-outline'} size={14} color={colors.primary} />
          <Text style={styles.addBtnText}>{reason ? 'Update' : 'Add reason'}</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.reasonCard}>
        {reason ? (
          <Text style={typography.body}>{reason}</Text>
        ) : (
          <Text style={typography.bodyMuted}>
            Tell the provider why you&apos;re booking. It reaches them before the
            appointment and helps them prepare.
          </Text>
        )}
        {channel ? (
          <View style={styles.syncRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textMuted} />
            <Text style={styles.syncText}>
              Changes are posted to your conversation so nothing is missed.
            </Text>
          </View>
        ) : null}

        {/* Readings for this visit. They sit with the reason because that's
            what they explain — the number is the reason, half the time. */}
        {canEditVisit ? (
          <View style={styles.vitalsBlock}>
            <View style={styles.vitalsHead}>
              <Ionicons name="pulse-outline" size={14} color={colors.error} />
              <Text style={styles.vitalsTitle}>Vitals for this visit</Text>
              <TouchableOpacity onPress={() => setVitalsOpen(true)} hitSlop={8}>
                <Text style={styles.vitalsAction}>
                  {vitalLines.length ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>

            {vitalLines.length ? (
              <View style={styles.vitalsChips}>
                {vitalLines.map((line) => (
                  <View key={line} style={styles.vitalChip}>
                    <Text style={styles.vitalChipText}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={typography.caption}>
                BP, sugar, pulse, temperature or anything else you&apos;ve measured.
                All optional.
              </Text>
            )}
          </View>
        ) : null}
      </Card>

      {/* ── Documents for this booking ───────────────────────────── */}
      <View style={styles.sectionHead}>
        <Text style={[styles.label, styles.sectionLabel]}>Your documents</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setDocOpen(true)}>
          <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.addBtnText}>Add document</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.docsCard}>
        {docs.length ? docs.map((d) => (
          <View key={d.name} style={styles.docRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={typography.body} numberOfLines={1}>{d.name}</Text>
              <Text style={typography.caption} numberOfLines={1}>
                {d.note ? `${d.note} · ` : ''}Shared with {p.provider || 'your provider'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={17} color={colors.success} />
          </View>
        )) : (
          <Text style={typography.bodyMuted}>
            Reports, scans or photos you want the provider to see. PDF, JPG or PNG.
          </Text>
        )}
      </Card>

      <Text style={styles.label}>Actions</Text>

      {effectiveStatus === 'pending_payment' ? (
        <PrimaryButton
          label={`Pay ${inr(amount)} now`}
          style={styles.action}
          onPress={() => router.push('/more/wallet')}
        />
      ) : null}

      {/* ── The call surface, shaped by how the product is bought ────
          A consultation IS one call, so it gets a Join button — never a
          notice. A plan's calls are scheduled by the team as the included
          counts allow, so they list out with their timings, and the joining
          controls wake up when a call's time arrives. */}
      {channel && kind === 'appointment'
        && (isLive || effectiveStatus === 'pending' || purchasedCall) ? (
          <TouchableOpacity
            style={[styles.joinLive, !joinActive && styles.joinIdle]}
            activeOpacity={0.85}
            disabled={!joinActive}
            onPress={() => router.push(`/consult/${liveCall?.id ?? nextCall?.id ?? 'a1'}`)}
          >
            {joinActive ? <View style={styles.liveDot} /> : (
              <Ionicons name="time-outline" size={17} color={colors.textMuted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.joinLiveTitle, !joinActive && styles.joinIdleTitle]}>
                Join {consultType === 'audio' || consultType === 'phone' || purchasedCall?.key === 'audio'
                  ? 'audio' : 'video'} call
              </Text>
              <Text style={[styles.joinLiveSub, !joinActive && styles.joinIdleSub]} numberOfLines={1}>
                {purchasedCall && !liveCall
                  ? `Purchased ${purchasedCall.key === 'audio' ? 'voice' : 'video'} call — join when you're ready`
                  : liveCall
                    ? `${liveCall.title} · ${liveCall.durationMin} min — live now`
                    : effectiveStatus === 'pending'
                      ? 'Opens once the provider accepts'
                      : `${nextCall?.scheduledStart ?? 'At your slot time'} · opens 5 minutes before`}
              </Text>
            </View>
            <Ionicons
              name={consultType === 'audio' || consultType === 'phone' ? 'call' : 'videocam'}
              size={20}
              color={joinActive ? colors.white : colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}

      {channel && kind !== 'appointment'
        && (isLive || effectiveStatus === 'pending' || purchasedCall)
        && (planCalls.length || purchasedCall) ? (
          <Card style={styles.planCalls}>
            <Text style={styles.planCallsHead}>SCHEDULED CALLS</Text>

            {/* ── Next scheduled call for you ─────────────────────────
                Said once, at the top, before the list repeats it. A plan
                runs several calls over weeks, so "when am I next seen, and
                which call is it?" is the thing worth answering plainly —
                the list below is for checking the rest of the schedule. */}
            {showSchedule ? (
              nextPlanCall ? (
                <View style={styles.nextUp}>
                  <View style={[styles.nextUpIcon, !nextPlanLive && styles.nextUpIconIdle]}>
                    <Ionicons
                      name={nextPlanCall.mode === 'video' ? 'videocam' : 'call'}
                      size={15}
                      color={colors.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextUpLabel}>NEXT SCHEDULED CALL FOR YOU</Text>
                    <Text style={styles.nextUpTitle}>
                      {callLabel(planCalls, nextPlanIdx)}
                    </Text>
                    <Text style={styles.nextUpSub}>
                      {nextPlanLive
                        ? `Live now · ${nextPlanCall.durationMin} min — join below`
                        : `${nextPlanCall.scheduledStart} · ${nextPlanCall.durationMin} min · ${
                          nextPlanCall.mode === 'video' ? 'video' : 'voice'} call`}
                    </Text>
                  </View>
                  {nextPlanLive ? <View style={styles.nextUpDot} /> : null}
                </View>
              ) : (
                /* Every call in the plan is behind them. That's not an error
                   — the team proposes the next one when it's due, and this
                   says so rather than leaving a silent gap. */
                <View style={[styles.nextUp, styles.nextUpEmpty]}>
                  <Ionicons name="checkmark-done-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.nextUpNone}>
                    Every call in this plan is done. Your care team will propose
                    another here if one is needed.
                  </Text>
                </View>
              )
            ) : null}

            {(showSchedule ? planCalls : []).map((c, i) => {
              const done = c.status === 'completed' || c.status === 'cancelled';
              const isNext = i === nextPlanIdx;
              const live = c.status === 'in_progress' || c.joinable;
              return (
                <View key={c.id} style={[styles.planCallRow, done && styles.planCallDone]}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : c.mode === 'video' ? 'videocam-outline' : 'call-outline'}
                    size={16}
                    color={done ? colors.success : isNext ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.planCallTitleRow}>
                      <Text
                        style={[typography.body, done && styles.planCallDoneText, { flexShrink: 1 }]}
                      >
                        {callLabel(planCalls, i)}
                      </Text>
                      {/* Ties the row back to the banner above, so the two
                          can't be read as two different calls. */}
                      {isNext ? (
                        <View style={styles.nextPill}>
                          <Text style={styles.nextPillText}>NEXT</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={typography.caption}>
                      {c.scheduledStart} · {c.durationMin} min
                      {isNext && !live ? ' · joining opens at this time' : ''}
                      {live ? ' · live now' : ''}
                    </Text>
                    {/* The next call carries the joining controls; they stay
                        greyed until its time, because in a plan the doctor
                        calls the patient in as the schedule allows. */}
                    {isNext && !done ? (
                      <View style={styles.planJoinRow}>
                        {effectiveComms(channel).video ? (
                          <TouchableOpacity
                            style={[styles.planJoinBtn, !live && styles.planJoinOff]}
                            disabled={!live}
                            onPress={() => router.push(`/consult/${c.id}`)}
                          >
                            <Ionicons name="videocam" size={13} color={live ? colors.white : colors.textMuted} />
                            <Text style={[styles.planJoinText, !live && styles.planJoinTextOff]}>Video</Text>
                          </TouchableOpacity>
                        ) : null}
                        {effectiveComms(channel).audio ? (
                          <TouchableOpacity
                            style={[styles.planJoinBtn, !live && styles.planJoinOff]}
                            disabled={!live}
                            onPress={() => router.push(`/consult/${c.id}`)}
                          >
                            <Ionicons name="call" size={13} color={live ? colors.white : colors.textMuted} />
                            <Text style={[styles.planJoinText, !live && styles.planJoinTextOff]}>Audio</Text>
                          </TouchableOpacity>
                        ) : null}
                        {effectiveComms(channel).chat ? (
                          <TouchableOpacity
                            style={[styles.planJoinBtn, !live && styles.planJoinOff]}
                            disabled={!live}
                            onPress={() => router.push(`/channel/${channel.id}`)}
                          >
                            <Ionicons name="chatbubble" size={13} color={live ? colors.white : colors.textMuted} />
                            <Text style={[styles.planJoinText, !live && styles.planJoinTextOff]}>Chat</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
            {purchasedCall ? (
              <View style={styles.planCallRow}>
                <Ionicons name="flash" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>
                    Purchased {purchasedCall.key === 'audio' ? 'voice' : 'video'} call
                  </Text>
                  <Text style={typography.caption}>Join when you&apos;re ready</Text>
                </View>
                <TouchableOpacity
                  style={styles.planJoinBtn}
                  onPress={() => router.push(`/channel/${channel.id}?tab=calls` as never)}
                >
                  <Ionicons name="arrow-forward" size={13} color={colors.white} />
                  <Text style={styles.planJoinText}>Join</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Card>
        ) : null}

      {/* A communication-enabled service is the whole point of the purchase —
          give it the strongest control on the screen. */}
      {isLive && channel ? (
        <TouchableOpacity
          style={styles.chatCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/channel/${channel.id}`)}
        >
          <View style={styles.chatIcon}>
            <Ionicons name="chatbubbles" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Open conversation</Text>
            <Text style={typography.bodyMuted} numberOfLines={1}>
              {channel.kind === 'group'
                ? `${isTeamProduct(kind) ? 'Care team' : 'Group'} thread · ${channel.counterparts.length} providers`
                : `Message ${channel.counterparts[0].name}`}
            </Text>
            {/* What the purchase actually includes, so it isn't a mystery
                until you open the thread. */}
            <View style={styles.capRow}>
              {effectiveComms(channel).chat ? (
                <MiniCap
                  icon="chatbubble-outline"
                  label={messagesLeft(channel) === null
                    ? 'Chat'
                    : `Chat · ${messagesLeft(channel)} left`}
                />
              ) : null}
              {effectiveComms(channel).audio ? <MiniCap icon="call-outline" label="Voice" /> : null}
              {effectiveComms(channel).video ? <MiniCap icon="videocam-outline" label="Video" /> : null}
              {effectiveComms(channel).documents ? <MiniCap icon="document-attach-outline" label="Files" /> : null}
            </View>
          </View>
          {channel.unread ? (
            <View style={styles.unread}><Text style={styles.unreadText}>{channel.unread}</Text></View>
          ) : (
            <Ionicons name="chevron-forward" size={17} color={colors.primary} />
          )}
        </TouchableOpacity>
      ) : null}

      {/* The execution surface, identical in shape for every product: each
          capability the purchase includes gets its own button, and a product
          that only sells a 10-minute video call simply has fewer of them.
          Driven by the comms terms snapshotted at purchase, exactly as the
          web's services page derives its controls. */}
      {channel && effectiveStatus === 'in_progress' ? (
        <View style={styles.commsRow}>
          {effectiveComms(channel).video ? (
            <CommsBtn
              icon="videocam-outline"
              label="Video"
              onPress={() => router.push(`/channel/${channel.id}?tab=calls` as never)}
            />
          ) : null}
          {effectiveComms(channel).audio ? (
            <CommsBtn
              icon="call-outline"
              label="Voice"
              onPress={() => router.push(`/channel/${channel.id}?tab=calls` as never)}
            />
          ) : null}
          {effectiveComms(channel).chat ? (
            <CommsBtn
              icon="chatbubble-outline"
              label="Chat"
              onPress={() => router.push(`/channel/${channel.id}` as never)}
            />
          ) : null}
          {effectiveComms(channel).documents ? (
            <CommsBtn
              icon="document-attach-outline"
              label="Files"
              onPress={() => router.push(`/channel/${channel.id}?tab=documents` as never)}
            />
          ) : null}
        </View>
      ) : null}

      {isLive && siblingCount > 1 ? (
        <TouchableOpacity style={styles.legsRow} onPress={() => router.push('/channels')}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={styles.legsText}>
            Plus a private thread with each of the {siblingCount - 1} team members
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.actionGrid}>
        <ActionTile
          icon="cloud-upload-outline"
          label="Attach document"
          onPress={() => setDocOpen(true)}
        />
        {effectiveStatus === 'confirmed' || effectiveStatus === 'in_progress' ? (
          <ActionTile
            icon="create-outline"
            label="Edit health info"
            onPress={() => router.push('/more/health-records')}
          />
        ) : null}
        {effectiveStatus === 'completed' ? (
          <>
            <ActionTile
              icon="document-text-outline"
              label="View prescription"
              onPress={() => router.push('/more/prescriptions')}
            />
            <ActionTile
              icon="star-outline"
              label="Rate & review"
              onPress={() => router.push('/(tabs)/appointments?view=completed')}
            />
          </>
        ) : null}
        {p.provider ? (
          <ActionTile
            icon="person-circle-outline"
            label={kind === 'appointment' ? 'View doctor' : 'View provider'}
            onPress={() => router.push(
              kind === 'appointment' ? '/(tabs)/find-care' : '/more/support-staff',
            )}
          />
        ) : null}
        <ActionTile
          icon="information-circle-outline"
          label="Product information"
          onPress={() => router.push(
            kind === 'recovery_plan' ? '/more/recovery-plans'
              : kind === 'advanced_plan' ? '/more/health-plans'
                : '/(tabs)/find-care',
          )}
        />
        <ActionTile
          icon="download-outline"
          label="Download invoice"
          onPress={() => router.push('/more/spending')}
        />
      </View>

      {/* ── What the provider can see ─────────────────────────────────
          Shown at every stage — pending, upcoming, in progress, completed —
          and placed after the actions: it's something to check rather than
          something to do. "Records shared: Yes" only means anything if you can
          see what Yes covered, and it stays switchable because consent given
          before a consultation can be withdrawn after it. */}
      <Text style={styles.label}>Shared medical records</Text>
      <SharedRecordsPanel
        scopeKind={scope.kind}
        scopeId={scope.id}
        patientName={p.patient ?? 'You'}
        shared={sharing}
        onChangeShared={(next: boolean) => {
          setSharing(next);
          // Write through to the shared store, so the My Bookings rows offer
          // (or stop offering) "Give records access" accordingly.
          if (storeKey) (next ? grantRecordsAccess : revokeRecordsAccess)(storeKey);
          // The provider is told either way — quietly withdrawing access while
          // they're mid-consultation would be worse than saying so.
          if (channel) {
            appendMessage(
              channel.id,
              next
                ? 'Patient shared their medical records for this booking.'
                : 'Patient withdrew access to their medical records for this booking.',
              'system',
            );
          }
        }}
      />

      {/* What the booking includes, what's left of it, and the ways to buy
          more. Sits after the action tiles so the free surface comes first and
          the paid one follows, rather than the other way round. */}
      {isLive && channel ? (
        <>
          <Text style={styles.label}>Included in this booking</Text>
          <AllowancePanel channel={channel} productName={p.name} />
        </>
      ) : null}

      {/* ── Payment ──────────────────────────────────────────────── */}
      <Text style={styles.label}>Payment</Text>
      <Card style={styles.card}>
        <View style={styles.payRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyMuted}>
              {installments > 1 ? `Instalment ${installmentsPaid} of ${installments}` : 'Amount'}
            </Text>
            <Text style={styles.amount}>{amount === 0 ? 'Fully covered' : inr(amount)}</Text>
          </View>
          <Badge label={paid ? 'Paid' : 'Unpaid'} tone={paid ? 'success' : 'warning'} />
        </View>

        {installments > 1 ? (
          <>
            <View style={styles.divider} />
            {Array.from({ length: installments }).map((_, i) => {
              const done = i < installmentsPaid;
              return (
                <View key={i} style={styles.instRow}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={done ? colors.success : colors.textMuted}
                  />
                  <Text style={[typography.body, { flex: 1 }]}>Instalment {i + 1}</Text>
                  <Text style={[styles.instAmt, done && styles.instAmtDone]}>
                    {done ? 'Paid' : 'Due later'}
                  </Text>
                </View>
              );
            })}
          </>
        ) : null}

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/more/spending')}>
          <Ionicons name="receipt-outline" size={14} color={colors.primary} />
          <Text style={styles.linkText}>View receipt & payment history</Text>
        </TouchableOpacity>
      </Card>


      {/* What the provider sent, for anything under way or finished. Kept on
          the booking rather than only in Documents so a patient looking back
          at one plan sees that plan's paperwork together. */}
      {(effectiveStatus === 'in_progress' || effectiveStatus === 'completed') && careDocs.length ? (
        <>
          <Text style={styles.label}>Shared by your care team</Text>
          <Card style={styles.docsCard}>
            {careDocs.map((d) => (
              <TouchableOpacity key={d.id} style={styles.docRow} activeOpacity={0.7}>
                <Ionicons name="document-text-outline" size={18} color={colors.warningDark} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body} numberOfLines={1}>{d.fileName}</Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {d.from}{d.date ? ` · ${d.date}` : ''} · via {d.source}
                  </Text>
                  {d.note ? (
                    <Text style={styles.docNote} numberOfLines={2}>{d.note}</Text>
                  ) : null}
                </View>
                <Ionicons name="download-outline" size={17} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </Card>
        </>
      ) : null}

      {effectiveStatus === 'completed' ? (
        <>
          <Text style={styles.label}>Prescriptions from this booking</Text>
          {prescriptionsFor(p.provider).map((rx) => (
            <TouchableOpacity
              key={rx.id}
              activeOpacity={0.85}
              onPress={() => router.push('/more/prescriptions')}
            >
              <Card style={styles.rxRow}>
                <View style={styles.rxIcon}>
                  <Ionicons name="medkit-outline" size={18} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3} numberOfLines={1}>{rx.doctor_name}</Text>
                  <Text style={typography.bodyMuted} numberOfLines={1}>
                    {rx.date} · {rx.diagnosis}
                  </Text>
                  <Text style={typography.caption}>
                    {rx.medicines.length} medicine{rx.medicines.length === 1 ? '' : 's'}
                    {rx.lab_tests.length ? ` · ${rx.lab_tests.length} lab test${rx.lab_tests.length === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      ) : null}

      {/* ── Follow-up / second opinion after completion ──────────── */}
      {effectiveStatus === 'completed' ? (
        <>
          <Text style={styles.label}>Ask a follow-up / second opinion</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/channel/${followUp.id}` as never)}
          >
            <Card style={styles.followCard}>
              <View style={styles.followIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3} numberOfLines={1}>
                  {followUpOpen
                    ? `Message ${followUp.counterparts[0].name}`
                    : 'Free follow-up window has closed'}
                </Text>
                <Text style={typography.bodyMuted}>
                  {followUpOpen
                    ? `${messagesLeft(followUp)} of ${SECOND_OPINION_COMMS.messageQuota} free messages left`
                    : 'The thread stays readable — a call or more messages can still be bought.'}
                </Text>
                <Text style={typography.caption}>
                  {followUpOpen
                    ? `Free for ${SECOND_OPINION_WINDOW_DAYS} days after completion · ${followUp.daysLeft} days left`
                    : `Free for ${SECOND_OPINION_WINDOW_DAYS} days after completion`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>

          {/* Past the free messages, a voice or video second opinion is bought
              through the same checkout as any other add-on. */}
          <AllowancePanel
            channel={followUp}
            productName={`Second opinion — ${p.name ?? 'this booking'}`}
            compact
          />
        </>
      ) : null}

      {effectiveStatus === 'confirmed' || effectiveStatus === 'pending_payment' ? (
        <TouchableOpacity style={styles.cancelRow} onPress={() => setCancelOpen(true)}>
          <Ionicons name="close-circle-outline" size={15} color={colors.error} />
          <Text style={styles.cancelText}>Cancel this booking</Text>
        </TouchableOpacity>
      ) : null}

      {effectiveStatus === 'cancelled' ? (
        <Card style={styles.cancelledCard}>
          <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
          <Text style={[typography.bodyMuted, { flex: 1 }]}>
            This booking was cancelled. Any refund due is returned to the
            original payment method within 5–7 working days.
          </Text>
        </Card>
      ) : null}

      {/* Adding a document. A real picker replaces the sample list; the rest
          of the flow — note, confirmation, posting to the thread — is what it
          will be. */}
      <VisitVitalsSheet
        visible={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        vitals={vitals}
        custom={customVitals}
        onSave={(v, c) => {
          setVitals(v);
          setCustomVitals(c);
          const lines = summarise(v, c);
          if (channel && lines.length) {
            appendMessage(
              channel.id,
              `Vitals for this visit — ${lines.join(' · ')}`,
            );
          }
          setVitalsOpen(false);
        }}
      />

      <AttachSheet
        visible={docOpen}
        onClose={() => setDocOpen(false)}
        sharedWith={p.provider || 'your provider'}
        maxMb={channel?.comms.maxAttachmentMb}
        onPick={(file, note) => {
          setDocs((d) => [...d, { name: file, note }]);
          // The provider sees it in the thread, not just in a list they might
          // never open.
          if (channel) {
            attachDocument(channel.id, file);
            appendMessage(
              channel.id,
              `Shared a document: ${file}${note ? ` — ${note}` : ''}`,
              'document',
            );
          }
          setDocOpen(false);
        }}
      />

      {/* Reason for the visit. Every save posts to the thread, so the provider
          sees the change rather than a silently-edited field. */}
      <AppModal
        visible={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={reason ? 'Update the reason' : 'Reason for this appointment'}
      >
        <Text style={typography.bodyMuted}>
          What would you like {p.provider || 'the provider'} to know before you meet?
        </Text>
        <TextInput
          value={reasonDraft}
          onChangeText={setReasonDraft}
          placeholder="e.g. Chest tightness when climbing stairs, started two weeks ago"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textArea]}
          multiline
        />
        {channel ? (
          <View style={styles.syncRow}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
            <Text style={styles.syncText}>
              This is posted to your conversation with {p.provider || 'your provider'}.
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label={reason ? 'Update reason' : 'Add reason'}
          disabled={!reasonDraft.trim()}
          style={styles.modalBtn}
          onPress={() => {
            const next = reasonDraft.trim();
            if (!next) return;
            if (channel) {
              appendMessage(
                channel.id,
                `${reason ? 'Updated the reason for this appointment' : 'Reason for this appointment'}: ${next}`,
              );
            }
            setReason(next);
            setReasonOpen(false);
          }}
        />
        <PrimaryButton
          label="Cancel"
          variant="outline"
          style={styles.modalBtnAlt}
          onPress={() => setReasonOpen(false)}
        />
      </AppModal>

      {/* Cancelling is not undoable, so it states the refund position first. */}
      <AppModal visible={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this booking?">
        <Text style={typography.body}>
          {paid
            ? `You paid ${inr(amount)}. Cancelling more than 24 hours before the appointment refunds in full; inside 24 hours the provider's cancellation policy applies.`
            : 'This booking is unpaid, so nothing will be refunded.'}
        </Text>
        <Text style={[typography.bodyMuted, styles.modalNote]}>
          Your consultation record and anything already shared stays in your
          health record.
        </Text>
        <PrimaryButton
          label="Keep my booking"
          style={styles.modalBtn}
          onPress={() => setCancelOpen(false)}
        />
        <PrimaryButton
          label="Cancel booking"
          variant="outline"
          style={styles.modalBtnAlt}
          onPress={() => { setCancelled(true); setCancelOpen(false); }}
        />
      </AppModal>
    </ScreenWrapper>
  );
}

function MiniCap({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.miniCap}>
      <Ionicons name={icon} size={10} color={colors.primary} />
      <Text style={styles.miniCapText}>{label}</Text>
    </View>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={colors.textSecondary} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function Row({
  icon, label, value,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={[typography.bodyMuted, styles.rowLabel]}>{label}</Text>
      <Text style={[typography.body, styles.rowValue]} numberOfLines={3}>{value}</Text>
    </View>
  );
}

function CommsBtn({
  icon, label, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.commsBtn} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.commsText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionTile({
  icon, label, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={19} color={colors.primary} />
      <Text style={styles.tileText} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: colors.background,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'capitalize' },

  label: { ...typography.label, marginTop: 22, marginBottom: 8 },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  rowLabel: { width: 96 },
  rowValue: { flex: 1, fontWeight: '600', textAlign: 'right' },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  instAmt: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  instAmtDone: { color: colors.success },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },

  action: { marginBottom: 10 },

  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#E8F1FC',
  },
  chatIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  unread: {
    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 11.5, fontWeight: '800', color: colors.white },

  capRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  miniCap: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  miniCapText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  legsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8,
  },
  legsText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.primary },
  joinLive: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, marginBottom: 12,
    borderRadius: radius.md, backgroundColor: colors.success,
  },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.white },
  joinLiveTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  joinLiveSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  nextCall: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  joinIdle: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  joinIdleTitle: { color: colors.textSecondary },
  joinIdleSub: { color: colors.textMuted },
  planCalls: { gap: 12, marginBottom: 12 },
  planCallsHead: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  planCallRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  planCallTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  nextPill: {
    paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4,
    backgroundColor: colors.primary,
  },
  nextPillText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },

  nextUp: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11,
    borderRadius: radius.sm, backgroundColor: '#E8F1FC',
    borderWidth: 1, borderColor: colors.primaryLight,
  },
  nextUpEmpty: { backgroundColor: colors.background, borderColor: colors.border },
  nextUpIcon: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.primary,
  },
  nextUpIconIdle: { backgroundColor: colors.primaryLight },
  nextUpLabel: { fontSize: 9.5, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  nextUpTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  nextUpSub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  nextUpNone: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.textMuted },
  // styles.liveDot is white — correct on the blue join button, invisible here.
  nextUpDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
  planCallDone: { opacity: 0.75 },
  planCallDoneText: { textDecorationLine: 'line-through', color: colors.textSecondary },
  planJoinRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
  planJoinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  planJoinOff: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  planJoinText: { fontSize: 11.5, fontWeight: '800', color: colors.white },
  planJoinTextOff: { color: colors.textMuted },
  docsCard: { gap: 0, paddingVertical: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  docNote: { fontSize: 11.5, color: colors.textSecondary, marginTop: 3, fontStyle: 'italic' },
  rxRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  followCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  followIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FC',
    alignItems: 'center', justifyContent: 'center',
  },
  rxIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FC',
    alignItems: 'center', justifyContent: 'center',
  },
  pendingCard: { gap: 14, borderWidth: 1, borderColor: '#F0D9A8', backgroundColor: '#FFFBF2' },
  pendingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  pendingIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0D6',
    alignItems: 'center', justifyContent: 'center',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  stepText: { fontSize: 9.5, fontWeight: '700', color: colors.textMuted },
  stepTextOn: { color: colors.warningDark },
  pendingNote: { fontSize: 11.5, lineHeight: 17, color: colors.textSecondary },

  rejectCard: { gap: 12, borderWidth: 1, borderColor: '#F5C6C2' },
  rejectIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FDECEA',
    alignItems: 'center', justifyContent: 'center',
  },
  refundRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  refundAmount: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  refundOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  refundIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  refundDone: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabel: { flex: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primary, marginTop: 22, marginBottom: 8,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  reasonCard: { gap: 10 },
  vitalsBlock: {
    gap: 8, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  vitalsHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  vitalsTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  vitalsAction: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  vitalsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vitalChip: {
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11,
    backgroundColor: '#FDECEA',
  },
  vitalChipText: { fontSize: 11.5, fontWeight: '700', color: colors.error },
  syncRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  syncText: { flex: 1, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sourceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sourceNote: { marginTop: 14 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4 },
  backLinkText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 8,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  fileRowOn: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  input: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: colors.textPrimary, marginTop: 14,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },

  commsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  commsBtn: {
    flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  commsText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47.5%', alignItems: 'center', gap: 7, paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tileText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },

  cancelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 20, paddingVertical: 12,
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.error },
  cancelledCard: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'flex-start' },
  modalNote: { marginTop: 10 },
  modalBtn: { marginTop: 20 },
  modalBtnAlt: { marginTop: 10 },
});
