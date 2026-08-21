import React, { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import EmptyState from '../../src/components/EmptyState';
import AllowancePanel from '../../src/components/AllowancePanel';
import AttachSheet from '../../src/components/AttachSheet';
import { ADD_ONS, chatBlockReason } from '../../src/data/addons';
import {
  appendMessage, attachDocument, channelById, ChannelMessage, consultationAllowance,
  callLabel, effectiveComms, isChatOnly, messagesLeft, minutesLeft, orderedCalls,
  ScheduledCall, STATUS_CHIP, validityLabel,
} from '../../src/data/channels';
import { colors, radius, typography } from '../../src/theme/theme';

type Tab = 'chat' | 'calls' | 'documents' | 'plan';

const ALL_TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'chat', label: 'Chat', icon: 'chatbubble-outline' },
  { key: 'calls', label: 'Calls', icon: 'videocam-outline' },
  { key: 'documents', label: 'Files', icon: 'document-attach-outline' },
  { key: 'plan', label: 'Plan', icon: 'pricetags-outline' },
];

const CALL_TONE: Record<ScheduledCall['status'], 'primary' | 'success' | 'warning' | 'neutral'> = {
  scheduled: 'warning',
  accepted: 'primary',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'neutral',
};

/**
 * One service channel: the thread, its scheduled calls, and its shared files.
 *
 * When the service ends the channel goes read-only rather than disappearing —
 * the history is part of the patient's care record, so composing stops but
 * reading never does.
 */
export default function ChannelScreen() {
  // `tab` lets a booking's Voice/Video/Files buttons land directly on the
  // right panel instead of always opening on the thread.
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const channel = channelById(id ?? '');

  const [tab, setTab] = useState<Tab>(
    (['chat', 'calls', 'documents', 'plan'].includes(tabParam ?? '') ? tabParam : 'chat') as Tab,
  );
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  // Attachments land in the thread and in Files at once, so a re-render is
  // needed to show both.
  const [attachTick, setAttachTick] = useState(0);
  const [sent, setSent] = useState<ChannelMessage[]>([]);

  if (!channel) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title="Conversation" fallback="/channels" />
        <EmptyState icon="chatbubble-outline" title="Conversation not found" />
      </ScreenWrapper>
    );
  }

  const live = channel.status === 'active';
  const messages = [...channel.messages, ...sent];
  // `attachTick` is read so an attach re-renders the thread and Files tab.
  void attachTick;

  // The service's own terms decide which panels exist. A service with no
  // calls shouldn't show an empty Calls tab — the web hides the panel outright
  // rather than presenting a capability that was never bought.
  // Bounded by this channel's own providers, not the product as a whole.
  const caps = effectiveComms(channel);
  /**
   * The next call still ahead of the patient, named rather than left to be
   * worked out from the list. Same rule as the booking's own Actions card, so
   * the two surfaces can never disagree about which call is next.
   */
  const calls = orderedCalls(channel.calls);
  const nextCallIdx = calls.findIndex(
    (c) => c.status === 'in_progress' || c.status === 'scheduled' || c.status === 'accepted',
  );
  const nextCall = nextCallIdx >= 0 ? calls[nextCallIdx] : null;
  const nextCallLive = !!nextCall && (nextCall.status === 'in_progress' || nextCall.joinable);
  /**
   * Whether this is a numbered series at all. `callLabel` earns the number the
   * same way for both screens; the pill only makes sense alongside one.
   */
  const numbered = calls.length > 1 && callLabel(calls, 0) !== calls[0]?.title;
  const allowance = consultationAllowance(channel);
  const chatOnly = channel.counterparts.every(isChatOnly);
  const callsOn = caps.audio || caps.video;
  const tabs = ALL_TABS.filter((t) => (
    t.key === 'chat' ? caps.chat
      : t.key === 'calls' ? callsOn
        : t.key === 'plan' ? true
          : caps.documents
  ));
  // Only the patient's own sends count against the allowance, so a provider
  // replying can never spend what the patient paid for.
  const mine = sent.filter((m) => m.from === 'me').length;
  const left = messagesLeft(channel, mine);
  // Two separate ceilings: the term allowance and today's cap. They fail for
  // different reasons and need different wording.
  const block = chatBlockReason(channel, mine);
  const outOfMessages = block !== null;
  const dailyLeft = caps.messagesPerDay == null
    ? null
    : Math.max(0, caps.messagesPerDay - channel.messagesToday - mine);
  const audioLeft = minutesLeft(caps.audioMinutesQuota, channel.audioMinutesUsed);
  const videoLeft = minutesLeft(caps.videoMinutesQuota, channel.videoMinutesUsed);

  const send = () => {
    if (!draft.trim() || outOfMessages) return;
    setSent((s) => [...s, {
      id: `local-${s.length}`, kind: 'text', from: 'me', text: draft.trim(), time: 'now',
    }]);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenWrapper contentStyle={{ paddingTop: 0 }} scroll={false}>
        <ScreenHeader title={channel.title} fallback="/channels" />

        {/* Who's in here, and how long it stays open. */}
        <Card style={styles.header}>
          <View style={styles.headerTop}>
            {channel.kind === 'group' ? (
              <View style={styles.groupAvatar}>
                {channel.counterparts.slice(0, 3).map((p, i) => (
                  <Image key={p.name} source={{ uri: p.avatar }} style={[styles.stackAvatar, { left: i * 13, zIndex: 3 - i }]} />
                ))}
              </View>
            ) : (
              <Image source={{ uri: channel.counterparts[0].avatar }} style={styles.avatar} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={typography.h3} numberOfLines={1}>{channel.serviceName}</Text>
              <Text style={typography.bodyMuted} numberOfLines={2}>
                {channel.counterparts.map((p) => p.name).join(', ')}
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Badge
              label={STATUS_CHIP[channel.status].label}
              tone={STATUS_CHIP[channel.status].tone === 'success' ? 'success' : 'neutral'}
            />
            <Text style={typography.caption}>
              {validityLabel(channel)} · until {channel.validUntil}
            </Text>
          </View>

          {/* What this purchase actually includes — snapshotted when it was
              bought, so it stays true even if the product changes later. */}
          <View style={styles.capRow}>
            {caps.chat ? (
              <Cap
                icon="chatbubble-outline"
                label={left === null ? 'Chat · unlimited' : `Chat · ${left} left`}
              />
            ) : null}
            {caps.audio ? (
              <Cap
                icon="call-outline"
                label={audioLeft == null ? 'Audio · unlimited' : `Audio · ${audioLeft} min left`}
              />
            ) : null}
            {caps.video ? (
              <Cap
                icon="videocam-outline"
                label={videoLeft == null ? 'Video · unlimited' : `Video · ${videoLeft} min left`}
              />
            ) : null}
            {caps.documents ? <Cap icon="document-attach-outline" label={`Files · ${caps.maxAttachmentMb} MB`} /> : null}
            {caps.forms ? <Cap icon="clipboard-outline" label="Forms" /> : null}
            {allowance ? (
              <Cap
                icon="calendar-outline"
                label={`Consults · ${allowance.used}/${allowance.max} used`}
              />
            ) : null}
          </View>

          {/* The admin can sell a slot with no calls at all; saying so beats
              leaving the patient to notice the Calls tab is missing. */}
          {chatOnly ? (
            <View style={styles.chatOnly}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
              <Text style={styles.chatOnlyText}>
                {channel.kind === 'group' ? 'This thread is' : `${channel.counterparts[0].name} is`}
                {' '}chat-only — no calls included.
              </Text>
            </View>
          ) : null}

          {/* On a team thread the members differ, so name who does what. */}
          {channel.kind === 'group' ? (
            <View style={styles.slotList}>
              {channel.counterparts.map((cp) => (
                <View key={cp.name} style={styles.slotRow}>
                  <Image source={{ uri: cp.avatar }} style={styles.slotAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotName} numberOfLines={1}>{cp.name}</Text>
                    <Text style={styles.slotRole} numberOfLines={1}>{cp.role}</Text>
                  </View>
                  <View style={styles.slotCaps}>
                    {cp.chat ? <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} /> : null}
                    {cp.voice ? <Ionicons name="call-outline" size={12} color={colors.textSecondary} /> : null}
                    {cp.video ? <Ionicons name="videocam-outline" size={12} color={colors.textSecondary} /> : null}
                    {isChatOnly(cp) ? <Text style={styles.slotNote}>chat only</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        <View style={styles.tabRow}>
          {tabs.map((t) => {
            const active = tab === t.key;
            const count = t.key === 'calls' ? channel.calls.length
              : t.key === 'documents' ? channel.documents.length : 0;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <Ionicons name={t.icon} size={14} color={active ? colors.white : colors.textSecondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                {count ? (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Thread ───────────────────────────────────────────────── */}
        {tab === 'chat' ? (
          <>
            <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
              {messages.map((m) => {
                if (m.kind === 'system') {
                  return (
                    <View key={m.id} style={styles.sysWrap}>
                      <View style={styles.sysChip}>
                        <Ionicons name="information-circle-outline" size={11} color={colors.textMuted} />
                        <Text style={styles.sysText}>{m.text}</Text>
                      </View>
                    </View>
                  );
                }
                const mine = m.from === 'me';
                return (
                  <View key={m.id} style={[styles.bubbleWrap, mine && styles.bubbleWrapMine]}>
                    {!mine && m.senderName ? (
                      <Text style={styles.senderName}>
                        {m.senderName}
                        {/* Support staff posting for a doctor is named, not hidden —
                            the patient should know who actually typed it. */}
                        {m.onBehalfOf ? ` · for ${m.onBehalfOf}` : ''}
                      </Text>
                    ) : null}
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      {m.kind === 'document' ? (
                        <View style={styles.docMsg}>
                          <Ionicons name="document-text" size={16} color={mine ? colors.white : colors.primary} />
                          <Text style={[styles.msgText, mine && styles.msgTextMine]} numberOfLines={1}>{m.text}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.msgText, mine && styles.msgTextMine]}>{m.text}</Text>
                      )}
                      <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{m.time}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* State the allowance where the typing happens, not only in the
                header — running out mid-thought with no warning is the thing
                to avoid. */}
            {live && caps.chat && (left !== null || dailyLeft !== null) ? (
              <View style={styles.quotaRow}>
                <Ionicons
                  name={outOfMessages ? 'alert-circle-outline' : 'chatbubble-ellipses-outline'}
                  size={12}
                  color={outOfMessages ? colors.error : colors.textMuted}
                />
                <Text style={[styles.quotaText, outOfMessages && styles.quotaTextOut]}>
                  {block === 'quota'
                    ? `You've used all ${channel.comms.messageQuota} messages included with this booking.`
                    : block === 'daily'
                      ? `Today's limit of ${caps.messagesPerDay} messages is used. Resets tomorrow.`
                      : `${left} of ${channel.comms.messageQuota} messages left`
                        + (dailyLeft !== null ? ` · ${dailyLeft} today` : '')}
                </Text>
              </View>
            ) : null}

            {live && outOfMessages ? (
              <View style={styles.quotaBlocked}>
                <View style={styles.blockedTop}>
                  <Ionicons
                    name={block === 'daily' ? 'time-outline' : 'lock-closed-outline'}
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.readOnlyText}>
                    {block === 'daily'
                      ? `You've sent today's ${caps.messagesPerDay} messages. More tomorrow — or top up now.`
                      : 'Your message allowance is spent. You can still read the thread'
                        + (caps.audio || caps.video ? ', book a call' : '') + ' and share files.'}
                  </Text>
                </View>
                <View style={styles.blockedActions}>
                  <TouchableOpacity style={styles.blockedBtn} onPress={() => setTab('plan')}>
                    <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
                    <Text style={styles.blockedBtnText}>
                      Add {ADD_ONS.chat.unit} · ₹{ADD_ONS.chat.price}
                    </Text>
                  </TouchableOpacity>
                  {caps.emergencyEnabled ? (
                    <TouchableOpacity
                      style={[styles.blockedBtn, styles.blockedBtnUrgent]}
                      onPress={() => setTab('plan')}
                    >
                      <Ionicons name="medkit-outline" size={14} color={colors.error} />
                      <Text style={[styles.blockedBtnText, styles.blockedBtnTextUrgent]}>
                        Emergency call
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : live ? (
              <View style={styles.composer}>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => setAttachOpen(true)}
                  accessibilityLabel="Add an attachment"
                >
                  <Ionicons name="attach" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Type a message…"
                  placeholderTextColor={colors.textMuted}
                  style={styles.composerInput}
                  multiline
                  onSubmitEditing={send}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !draft.trim() && styles.sendBtnOff]}
                  onPress={send}
                  disabled={!draft.trim()}
                >
                  <Ionicons name="send" size={17} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.readOnly}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                <Text style={styles.readOnlyText}>
                  This service has ended. You can still read everything here.
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* ── Scheduled calls ──────────────────────────────────────── */}
        {tab === 'calls' ? (
          <ScrollView contentContainerStyle={styles.panelContent}>
            {/* Which call is next, before the list of all of them. */}
            {calls.length ? (
              nextCall ? (
                <View style={styles.nextUp}>
                  <View style={[styles.nextUpIcon, !nextCallLive && styles.nextUpIconIdle]}>
                    <Ionicons
                      name={nextCall.mode === 'video' ? 'videocam' : 'call'}
                      size={15}
                      color={colors.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextUpLabel}>NEXT SCHEDULED CALL FOR YOU</Text>
                    <Text style={styles.nextUpTitle}>
                      {callLabel(calls, nextCallIdx)}
                    </Text>
                    <Text style={styles.nextUpSub}>
                      {nextCallLive
                        ? `Live now · ${nextCall.durationMin} min — join below`
                        : `${nextCall.scheduledStart} · ${nextCall.durationMin} min · ${
                          nextCall.mode === 'video' ? 'video' : 'voice'} call`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.nextUp, styles.nextUpEmpty]}>
                  <Ionicons name="checkmark-done-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.nextUpNone}>
                    Every call here is done. Your care team will propose another
                    if one is needed.
                  </Text>
                </View>
              )
            ) : null}

            {calls.length ? calls.map((c, i) => (
              <Card key={c.id} style={styles.callCard}>
                <View style={styles.callTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.callTitleRow}>
                      <Text style={[typography.h3, { flexShrink: 1 }]}>{c.title}</Text>
                      {numbered && i === nextCallIdx ? (
                        <View style={styles.nextPill}>
                          <Text style={styles.nextPillText}>NEXT</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.callMeta}>
                      <Ionicons
                        name={c.mode === 'video' ? 'videocam-outline' : 'call-outline'}
                        size={13}
                        color={colors.textMuted}
                      />
                      <Text style={typography.bodyMuted}>
                        {c.mode === 'video' ? 'Video' : 'Voice'} · {c.scheduledStart} · {c.durationMin} min
                      </Text>
                    </View>
                    <Text style={typography.caption}>
                      Proposed by {c.proposedBy === 'provider' ? 'your provider' : 'you'}
                    </Text>
                  </View>
                  <Badge label={c.status.replace('_', ' ')} tone={CALL_TONE[c.status]} />
                </View>

                <View style={styles.callActions}>
                  {/* Join opens 5 minutes before the start, same rule as a
                      consultation; an in-progress call is always joinable. */}
                  {c.status === 'in_progress' || c.joinable ? (
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() => router.push(`/consult/${c.id}`)}
                    >
                      <Ionicons name={c.mode === 'video' ? 'videocam' : 'call'} size={15} color={colors.white} />
                      <Text style={styles.joinText}>Join {c.mode === 'video' ? 'video' : 'voice'} call</Text>
                    </TouchableOpacity>
                  ) : c.status === 'scheduled' ? (
                    <>
                      <TouchableOpacity style={styles.ghostBtn}>
                        <Text style={styles.ghostText}>Accept</Text>
                      </TouchableOpacity>
                      <Text style={styles.callNote}>Join opens 5 minutes before</Text>
                    </>
                  ) : (
                    <Text style={styles.callNote}>
                      {c.status === 'completed' ? 'This call has ended.' : 'Cancelled.'}
                    </Text>
                  )}
                </View>
              </Card>
            )) : (
              <EmptyState icon="videocam-outline" title="No calls scheduled" subtitle="Your provider will propose a time here." />
            )}

            {live ? (
              <TouchableOpacity style={styles.proposeBtn}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={styles.proposeText}>
                  Propose a {caps.video && caps.audio ? 'video or voice' : caps.video ? 'video' : 'voice'} call
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}

        {/* ── Plan: what's included, what's left, and how to top up ── */}
        {tab === 'plan' ? (
          <ScrollView contentContainerStyle={styles.panelContent}>
            <AllowancePanel channel={channel} />
          </ScrollView>
        ) : null}

        {/* ── Shared documents ─────────────────────────────────────── */}
        {tab === 'documents' ? (
          <ScrollView contentContainerStyle={styles.panelContent}>
            {channel.documents.length ? channel.documents.map((d) => (
              <Card key={d.id} style={styles.docRow}>
                <Ionicons name="document-text-outline" size={19} color={colors.warningDark} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body} numberOfLines={1}>{d.fileName}</Text>
                  <Text style={typography.caption}>
                    {d.sizeLabel} · {d.uploadedBy} · {d.uploadedOn}
                  </Text>
                </View>
                <TouchableOpacity hitSlop={8}>
                  <Ionicons name="download-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            )) : (
              <EmptyState icon="document-attach-outline" title="No files yet" />
            )}

            {live ? (
              <TouchableOpacity style={styles.proposeBtn} onPress={() => setAttachOpen(true)}>
                <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
                <Text style={styles.proposeText}>
                  Add from camera, photos or files — up to {caps.maxAttachmentMb} MB
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[typography.caption, styles.uploadClosed]}>
                Uploads closed. Existing files stay available.
              </Text>
            )}
          </ScrollView>
        ) : null}
        <AttachSheet
          visible={attachOpen}
          onClose={() => setAttachOpen(false)}
          onPick={(file, note) => {
            attachDocument(channel.id, file);
            appendMessage(
              channel.id,
              `${file}${note ? ` — ${note}` : ''}`,
              'document',
            );
            setAttachTick((n) => n + 1);
            setAttachOpen(false);
          }}
          sharedWith={channel.counterparts.map((c) => c.name).join(', ')}
          maxMb={caps.maxAttachmentMb}
        />
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

function Cap({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.cap}>
      <Ionicons name={icon} size={11} color={colors.textSecondary} />
      <Text style={styles.capText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, marginBottom: 12 },
  capRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.background,
  },
  capText: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  callMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  groupAvatar: { width: 44, height: 44, justifyContent: 'center' },
  stackAvatar: {
    position: 'absolute', width: 29, height: 29, borderRadius: 15,
    borderWidth: 2, borderColor: colors.surface,
  },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chatOnly: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatOnlyText: { flex: 1, fontSize: 11.5, color: colors.textMuted },
  slotList: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  slotAvatar: { width: 26, height: 26, borderRadius: 13 },
  slotName: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  slotRole: { fontSize: 10.5, color: colors.textMuted },
  slotCaps: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slotNote: { fontSize: 10, fontWeight: '700', color: colors.textMuted },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4, marginBottom: 12,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: radius.sm - 2,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  tabCount: {
    minWidth: 18, paddingHorizontal: 5, borderRadius: 9,
    backgroundColor: colors.background, alignItems: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10.5, fontWeight: '800', color: colors.textSecondary },
  tabCountTextActive: { color: colors.white },

  thread: { flex: 1 },
  threadContent: { paddingBottom: 12, gap: 10 },
  sysWrap: { alignItems: 'center', marginVertical: 4 },
  sysChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '90%',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.background,
  },
  sysText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  bubbleWrap: { alignItems: 'flex-start', maxWidth: '84%' },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  senderName: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 3, marginLeft: 4 },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, gap: 3 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  docMsg: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  msgText: { fontSize: 13.5, lineHeight: 19, color: colors.textPrimary },
  msgTextMine: { color: colors.white },
  msgTime: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end' },
  msgTimeMine: { color: 'rgba(255,255,255,0.75)' },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8 },
  attachBtn: { padding: 9 },
  composerInput: {
    flex: 1, maxHeight: 110, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: colors.border },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 8 },
  quotaText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  quotaTextOut: { color: colors.error },
  quotaBlocked: {
    gap: 10, padding: 12,
    borderRadius: radius.sm, backgroundColor: colors.background, marginTop: 8,
  },
  blockedTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  blockedActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  blockedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  blockedBtnUrgent: { borderColor: colors.error },
  blockedBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  blockedBtnTextUrgent: { color: colors.error },
  readOnly: {
    flexDirection: 'row', alignItems: 'center', gap: 7, padding: 12,
    borderRadius: radius.sm, backgroundColor: colors.background, marginTop: 8,
  },
  readOnlyText: { flex: 1, fontSize: 12, color: colors.textMuted },

  panelContent: { paddingBottom: 20, gap: 10 },
  callCard: { gap: 12 },
  callTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  callTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
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
  callActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.success,
  },
  joinText: { fontSize: 13, fontWeight: '700', color: colors.white },
  ghostBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  ghostText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  callNote: { fontSize: 11.5, color: colors.textMuted, flexShrink: 1 },
  proposeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
  },
  proposeText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  uploadClosed: { textAlign: 'center', marginTop: 6 },
});
