import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import EmptyState from '../../src/components/EmptyState';
import AllowancePanel from '../../src/components/AllowancePanel';
import {
  familyDoctor, secondOpinionBookings, SecondOpinionBooking,
} from '../../src/data/mock';
import {
  secondOpinionChannel, SECOND_OPINION_COMMS, SECOND_OPINION_WINDOW_DAYS,
} from '../../src/data/channels';
import { isExtended } from '../../src/data/extensions';
import { colors, radius, typography } from '../../src/theme/theme';

const prettify = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Rx = NonNullable<SecondOpinionBooking['prescription']>;

/**
 * What a second opinion includes, taken from the channel's own terms rather
 * than written out again — the hints and the counters can't disagree that way.
 */
const MODES = [
  {
    key: 'chat',
    label: 'Chat',
    icon: 'chatbubble-ellipses' as const,
    hint: `${SECOND_OPINION_COMMS.messageQuota} messages free`,
  },
  {
    key: 'audio',
    label: 'Voice',
    icon: 'call' as const,
    hint: `${SECOND_OPINION_COMMS.audioCallsIncluded} call · ${SECOND_OPINION_COMMS.audioMinutesQuota} min`,
  },
  {
    key: 'video',
    label: 'Video',
    icon: 'videocam' as const,
    hint: `${SECOND_OPINION_COMMS.videoCallsIncluded} call · ${SECOND_OPINION_COMMS.videoMinutesQuota} min`,
  },
];

/** How many finished second opinions the Completed head lists. */
const COMPLETED_LIMIT = 30;

/** The two heads, side by side. */
const HEADS = [
  { key: 'open' as const, label: 'In progress', icon: 'hourglass-outline' as const },
  { key: 'done' as const, label: 'Completed', icon: 'checkmark-done-outline' as const },
];

export default function FamilyDoctorScreen() {
  const router = useRouter();
  const [linked, setLinked] = useState(true);
  const [code, setCode] = useState('');
  const [viewRx, setViewRx] = useState<Rx | null>(null);
  const [startedMode, setStartedMode] = useState<string | null>(null);
  const [confirmDelink, setConfirmDelink] = useState(false);
  // Opens on In progress: the ones you can still ask about for free are the
  // reason to be on this screen.
  const [head, setHead] = useState<'open' | 'done'>('open');

  /** Days between the booking completing and today's demo date. */
  const daysSince = (iso: string) => {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.round((Date.parse('2026-08-18') - then) / 86_400_000));
  };

  // One thread per booking, with the family doctor — cached, so the counters
  // and anything sent survive leaving the screen.
  const channelFor = (b: SecondOpinionBooking) => secondOpinionChannel({
    bookingId: b.booking_id,
    doctorName: familyDoctor.name,
    productName: prettify(b.type),
    role: 'Family Doctor',
    daysSinceCompletion: daysSince(b.completed_date),
    seed: b.thread,
  });

  // A second opinion is "in progress" while its free window is still open, and
  // "completed" once it has closed — the same lifecycle the bookings list uses,
  // so the two screens don't disagree about what finished means.
  //
  // Newest first in both: the one you're most likely to be looking for is the
  // one you had most recently.
  const byNewest = [...secondOpinionBookings]
    .sort((a, b) => b.completed_date.localeCompare(a.completed_date));
  // Buying more chat or a call re-opens the conversation, so the booking
  // comes back under In progress — that's where the patient was told to look.
  const open = (b: SecondOpinionBooking) =>
    channelFor(b).daysLeft > 0 || isExtended(`so-${b.booking_id}`);
  const openOpinions = byNewest.filter(open);
  const allClosed = byNewest.filter((b) => !open(b));
  // Completed is capped: a patient of several years would otherwise scroll
  // through hundreds of finished threads to reach anything useful. Older ones
  // aren't deleted — they stay in the health record — so the cap is stated
  // rather than left to look like the list simply ends.
  const closedOpinions = allClosed.slice(0, COMPLETED_LIMIT);
  const olderHidden = allClosed.length - closedOpinions.length;

  const renderBooking = (b: SecondOpinionBooking) => {
    const ch = channelFor(b);
    const open = ch.daysLeft > 0;

    return (
      <Card key={b.booking_id} style={styles.bookingCard}>
        <View style={styles.bookingTop}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{prettify(b.type)}</Text>
            <Text style={typography.bodyMuted}>{b.provider_name}</Text>
          </View>
          {b.prescription ? (
            <Badge label={prettify(b.prescription.status)} tone="success" />
          ) : (
            <Badge label="No prescription" tone="neutral" />
          )}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={typography.caption}>BOOKED</Text>
            <Text style={styles.dateValue}>{b.booked_date}</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={typography.caption}>COMPLETED</Text>
            <Text style={styles.dateValue}>{b.completed_date}</Text>
          </View>
        </View>

        {b.prescription ? (
          <>
            <TouchableOpacity
              style={styles.rxRow}
              onPress={() => setViewRx(b.prescription!)}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={[typography.body, { flex: 1 }]}>View prescription</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={[typography.label, styles.askLabel]}>ASK YOUR FAMILY DOCTOR</Text>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={styles.modeBtn}
                  disabled={!linked}
                  onPress={() => setStartedMode(`${b.booking_id}:${m.key}`)}
                >
                  <Ionicons name={m.icon} size={16} color={linked ? colors.primary : colors.textMuted} />
                  <Text style={[styles.modeLabel, !linked && styles.modeDisabled]}>{m.label}</Text>
                  {/* Past the window it's still available, just no longer
                      free — saying "5 messages free" then would be a lie. */}
                  <Text style={styles.modeHint}>{open ? m.hint : 'Buy to continue'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!linked ? (
              <Text style={styles.linkFirst}>Link a family doctor to ask for a second opinion.</Text>
            ) : (
              <>
                {/* The same allowance panel the paid channels use — running out
                    doesn't end the conversation, it prices it. */}
                <AllowancePanel
                  channel={ch}
                  productName={`Second opinion — ${prettify(b.type)}`}
                  compact
                />
                <TouchableOpacity
                  style={styles.openThread}
                  onPress={() => router.push(`/channel/${ch.id}` as never)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.openThreadText}>
                      {ch.messagesUsed || ch.documents.length ? 'Open conversation' : 'Start the conversation'}
                    </Text>
                    {/* The last thing said, so the state of the thread is
                        legible without opening every one of them. */}
                    {ch.lastTime ? (
                      <Text style={styles.openThreadLast} numberOfLines={1}>
                        {ch.lastMessage} · {ch.lastTime}
                      </Text>
                    ) : null}
                  </View>
                  {ch.unread ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{ch.unread}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.windowNote, !open && styles.windowNoteClosed]}>
                  {open
                    ? `Free for ${SECOND_OPINION_WINDOW_DAYS} days after this booking `
                      + `completed · ${ch.daysLeft} days left`
                    : `Free window closed — it ran for ${SECOND_OPINION_WINDOW_DAYS} days `
                      + 'after this booking completed. You can still buy a chat or a call.'}
                </Text>
              </>
            )}
          </>
        ) : null}
      </Card>
    );
  };

  const startedBooking = startedMode ? startedMode.split(':')[0] : null;
  const startedKind = startedMode ? startedMode.split(':')[1] : null;
  const startedChannel = startedBooking
    ? secondOpinionBookings.find((b) => b.booking_id === startedBooking)
    : null;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Family Doctor" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Your empanelled family doctor can give a second opinion on any completed
        booking's prescription.
      </Text>

      {linked ? (
        <Card style={styles.doctorCard}>
          <View style={styles.doctorTop}>
            <Image source={{ uri: familyDoctor.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{familyDoctor.name}</Text>
              <Text style={typography.bodyMuted}>{familyDoctor.qualification}</Text>
              <Text style={typography.caption}>{familyDoctor.hospital}</Text>
            </View>
            <Badge label="Linked" tone="success" />
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="link-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>Linked since {familyDoctor.linked_since}</Text>
            <Ionicons name="key-outline" size={14} color={colors.textSecondary} style={styles.metaIcon} />
            <Text style={styles.metaText}>{familyDoctor.empanel_code}</Text>
          </View>
          <View style={styles.doctorActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push(`/doctor/d1`)}>
              <Text style={styles.ghostText}>View profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => setConfirmDelink(true)}>
              <Text style={[styles.ghostText, styles.danger]}>Delink</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <>
          <Card style={styles.joinCard}>
            <Text style={typography.h3}>Join with a code</Text>
            <Text style={typography.bodyMuted}>
              Enter the empanelment code your doctor shared with you.
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="FD-0000"
                autoCapitalize="characters"
                placeholderTextColor={colors.textMuted}
                style={styles.codeInput}
              />
              <PrimaryButton
                label="Join"
                disabled={code.trim().length < 4}
                style={styles.joinBtn}
                onPress={() => { setLinked(true); setCode(''); }}
              />
            </View>
          </Card>

          <Card style={styles.joinCard}>
            <Text style={typography.h3}>Or find a family doctor</Text>
            <Text style={typography.bodyMuted}>
              Search available doctors and send an empanelment request.
            </Text>
            <PrimaryButton
              label="Search doctors"
              variant="outline"
              style={{ marginTop: 12 }}
              onPress={() => router.push('/(tabs)/find-care')}
            />
          </Card>
        </>
      )}

      {/* ── Second opinions ──────────────────────────────────────────
          Two heads side by side rather than stacked: a card leaves In
          Progress the moment its free window closes and appears under
          Completed, and putting them next to each other makes that one tap
          to follow instead of a scroll past thirty finished threads. */}
      {secondOpinionBookings.length ? (
        <>
          <View style={styles.headRow}>
            {HEADS.map((h) => {
              const on = head === h.key;
              const count = h.key === 'open' ? openOpinions.length : allClosed.length;
              return (
                <TouchableOpacity
                  key={h.key}
                  style={[styles.headTab, on && styles.headTabOn]}
                  onPress={() => setHead(h.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={h.icon}
                    size={14}
                    color={on ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.headTabText, on && styles.headTabTextOn]}>
                    {h.label}
                  </Text>
                  <View style={[styles.countChip, on && styles.countChipOn]}>
                    <Text style={[styles.countText, on && styles.countTextOn]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {head === 'open' ? (
            <>
              <Text style={[typography.bodyMuted, styles.sectionHint]}>
                Still inside the free window — ask your family doctor now. Each
                one moves to Completed when its {SECOND_OPINION_WINDOW_DAYS} days
                are up.
              </Text>
              {openOpinions.length
                ? openOpinions.map(renderBooking)
                : (
                  <Card style={styles.emptyCard}>
                    <Ionicons name="time-outline" size={17} color={colors.textMuted} />
                    <Text style={[typography.bodyMuted, { flex: 1 }]}>
                      Nothing in progress. A second opinion opens for{' '}
                      {SECOND_OPINION_WINDOW_DAYS} days each time a booking completes.
                    </Text>
                  </Card>
                )}
            </>
          ) : (
            <>
              <Text style={[typography.bodyMuted, styles.sectionHint]}>
                The free window has closed. You can still buy a chat or a call.
                {allClosed.length > COMPLETED_LIMIT
                  ? ` Showing the ${COMPLETED_LIMIT} most recent.`
                  : ''}
              </Text>
              {closedOpinions.length
                ? closedOpinions.map(renderBooking)
                : (
                  <Card style={styles.emptyCard}>
                    <Ionicons name="checkmark-done-outline" size={17} color={colors.textMuted} />
                    <Text style={[typography.bodyMuted, { flex: 1 }]}>
                      Nothing here yet. Second opinions land here once their free
                      window closes.
                    </Text>
                  </Card>
                )}

              {/* Never let a cap look like the end of the record. */}
              {olderHidden > 0 ? (
                <Card style={styles.emptyCard}>
                  <Ionicons name="archive-outline" size={17} color={colors.textMuted} />
                  <Text style={[typography.bodyMuted, { flex: 1 }]}>
                    {olderHidden} older second opinion{olderHidden === 1 ? '' : 's'} aren&apos;t
                    listed here. They stay in your health record — open the booking to
                    see its prescription and thread.
                  </Text>
                </Card>
              ) : null}
            </>
          )}
        </>
      ) : (
        <EmptyState
          icon="chatbubbles-outline"
          title="No completed bookings yet"
          subtitle="Details appear only after a booking is completed."
        />
      )}

      {/* Read-only prescription viewer */}
      <AppModal visible={!!viewRx} onClose={() => setViewRx(null)} title="Prescription">
        {viewRx ? (
          <ScrollView style={styles.rxScroll}>
            <Text style={typography.bodyMuted}>
              By {viewRx.doctor_name} · {viewRx.issue_date}
            </Text>

            <Text style={[typography.label, styles.rxLabel]}>DIAGNOSIS</Text>
            <Text style={typography.body}>{viewRx.diagnosis}</Text>

            <Text style={[typography.label, styles.rxLabel]}>MEDICINES</Text>
            {viewRx.medicines.map((m, i) => (
              <View key={i} style={styles.medRow}>
                <View style={styles.bulletDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  <Text style={typography.bodyMuted}>
                    {[m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            ))}

            {viewRx.notes ? (
              <>
                <Text style={[typography.label, styles.rxLabel]}>NOTES</Text>
                <Text style={typography.body}>{viewRx.notes}</Text>
              </>
            ) : null}

            {viewRx.doctors_advice ? (
              <>
                <Text style={[typography.label, styles.rxLabel]}>ADVICE</Text>
                <Text style={typography.body}>{viewRx.doctors_advice}</Text>
              </>
            ) : null}

            {viewRx.has_pdf ? (
              <TouchableOpacity style={styles.pdfRow}>
                <Ionicons name="download-outline" size={16} color={colors.primary} />
                <Text style={styles.pdfText}>Open PDF</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}
      </AppModal>

      {/* Second-opinion started confirmation */}
      <AppModal
        visible={!!startedMode}
        onClose={() => setStartedMode(null)}
        title="Second opinion started"
      >
        <View style={styles.startedWrap}>
          <Ionicons name="checkmark-circle" size={40} color={colors.success} />
          <Text style={[typography.body, styles.startedText]}>
            A {startedKind === 'chat' ? 'chat' : startedKind === 'audio' ? 'voice call' : 'video call'} with{' '}
            {familyDoctor.name} has been requested.
          </Text>
          <Text style={typography.caption}>
            {startedKind === 'chat'
              ? `${SECOND_OPINION_COMMS.messageQuota} free messages included.`
              : `One ${startedKind === 'audio' ? 'voice' : 'video'} call included, up to `
                + `${startedKind === 'audio' ? SECOND_OPINION_COMMS.audioMinutesQuota : SECOND_OPINION_COMMS.videoMinutesQuota} minutes.`}
          </Text>
          <PrimaryButton
            label={startedKind === 'chat' ? 'Open conversation' : 'Open conversation & join'}
            style={styles.startedBtn}
            onPress={() => {
              const b = startedChannel;
              setStartedMode(null);
              if (b) router.push(`/channel/${channelFor(b).id}` as never);
            }}
          />
        </View>
      </AppModal>

      {/* Delink confirmation */}
      <AppModal visible={confirmDelink} onClose={() => setConfirmDelink(false)} title="Delink family doctor?">
        <Text style={typography.body}>
          You'll no longer be able to ask {familyDoctor.name} for a second opinion.
          You can re-link later with their code.
        </Text>
        <View style={styles.confirmActions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.confirmBtn} onPress={() => setConfirmDelink(false)} />
          <PrimaryButton
            label="Delink"
            style={styles.confirmBtn}
            onPress={() => { setLinked(false); setConfirmDelink(false); }}
          />
        </View>
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 16 },
  doctorCard: { gap: 12, marginBottom: 20 },
  doctorTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaIcon: { marginLeft: 10 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  doctorActions: { flexDirection: 'row', gap: 8 },
  ghostBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  ghostText: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
  danger: { color: colors.error },
  joinCard: { gap: 6, marginBottom: 14 },
  codeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  codeInput: {
    flex: 1, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  joinBtn: { width: 96 },
  sectionLabel: { marginTop: 4, marginBottom: 4 },
  sectionHint: { marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 10 },
  headTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  headTabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  headTabText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  headTabTextOn: { color: colors.white },
  countChip: {
    minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  countChipOn: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'transparent' },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  countTextOn: { color: colors.white },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  openThread: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  openThreadText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  openThreadLast: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  unread: {
    minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill,
    backgroundColor: colors.error,
  },
  unreadText: { fontSize: 10.5, fontWeight: '800', color: colors.white, textAlign: 'center' },
  bookingCard: { gap: 12, marginBottom: 12 },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dateRow: { flexDirection: 'row', gap: 24 },
  dateCol: { gap: 2 },
  dateValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  rxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  askLabel: { marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  modeLabel: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  modeDisabled: { color: colors.textMuted },
  modeHint: { fontSize: 9.5, color: colors.textMuted },
  linkFirst: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  windowNote: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  windowNoteClosed: { color: colors.warningDark, fontWeight: '600' },
  rxScroll: { maxHeight: 400 },
  rxLabel: { marginTop: 14, marginBottom: 6 },
  medRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  medName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  pdfText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  startedWrap: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  startedText: { textAlign: 'center', marginTop: 6 },
  startedBtn: { marginTop: 14, alignSelf: 'stretch' },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  confirmBtn: { flex: 1 },
});
