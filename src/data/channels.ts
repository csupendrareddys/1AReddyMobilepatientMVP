import { ProductKind } from './checkout';

/**
 * Service communication channels, mirroring the web's `/channels` model.
 *
 * A service can be *communication-enabled*. Buying one opens a channel with
 * the provider for the service's validity window. A GROUP service opens
 * several at once — a group chat holding the patient and every doctor, plus a
 * 1:1 leg with each doctor — all sharing one `groupId` so they cluster under a
 * single heading instead of scattering through a flat list.
 *
 * Each channel carries three panels: the message thread, shared documents, and
 * scheduled calls. Nothing here talks to a server; it exists so the design has
 * a real conversation to lay out.
 */

/**
 * The admin's communication terms for one product, mirroring the web's
 * CommunicationSection. These are *snapshotted onto the purchase at
 * activation*, so a channel keeps the terms it was bought under even after the
 * admin edits the product — which is why they live on the channel, not on the
 * catalogue entry.
 */
export type CommsConfig = {
  isEnabled: boolean;
  chat: boolean;
  audio: boolean;
  video: boolean;
  documents: boolean;
  forms: boolean;
  /** null = unmetered. */
  audioMinutesQuota: number | null;
  videoMinutesQuota: number | null;
  /**
   * How many messages the patient may send over the life of this purchase.
   * Counts the patient's own sends only — a provider replying can't spend the
   * allowance the patient paid for. null = unmetered.
   */
  messageQuota: number | null;
  /**
   * A second ceiling on top of the total: a plan can include 100 messages but
   * still cap them at 10 a day, so one anxious afternoon can't burn the whole
   * term's allowance. null = no daily cap.
   */
  messagesPerDay: number | null;
  /** Calls included with the purchase, as counts — what the admin sells. */
  videoCallsIncluded: number;
  audioCallsIncluded: number;
  /** Whether a paid emergency call can be raised against this booking. */
  emergencyEnabled: boolean;
  maxAttachmentMb: number;
  /**
   * Days the plan runs for, as the backend states it. Zero means the product
   * isn't day-based at all — a single consultation has no term — and nothing
   * about days is shown for it.
   */
  planDays: number;
};

/**
 * One provider slot on a team product.
 *
 * A group offering configures communication PER MEMBER, not per product — the
 * admin ticks Chat / Voice / Video on each slot and sets its consultation
 * count and call-duration bounds. So one plan can pair a video-enabled
 * cardiologist with a chat-only dietitian, and the app has to reflect that
 * rather than pretending the whole team offers the same thing.
 */
export type Counterpart = {
  name: string;
  role: string;
  avatar: string;
  chat: boolean;
  voice: boolean;
  video: boolean;
  /** Consultations included with this slot, as the admin bounds them. */
  minConsultations?: number;
  maxConsultations?: number;
  consultationsUsed?: number;
  /** Per-call duration bounds in minutes. */
  voiceMinutes?: [number, number];
  videoMinutes?: [number, number];
};

/** A slot with neither call type is what the admin calls "chat-only". */
export const isChatOnly = (c: Counterpart) => !c.voice && !c.video;

export type ChannelStatus = 'active' | 'read_only' | 'archived';

export const STATUS_CHIP: Record<ChannelStatus, { label: string; tone: 'success' | 'neutral' }> = {
  active: { label: 'Active', tone: 'success' },
  read_only: { label: 'Ended', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export type ChannelMessage = {
  id: string;
  /** `system` renders as a centred audit chip, not a bubble. */
  kind: 'text' | 'system' | 'document';
  from: 'me' | 'them';
  senderName?: string;
  text: string;
  time: string;
  /** Set when a support person posted for the doctor — accountability. */
  onBehalfOf?: string;
};

export type ScheduledCall = {
  id: string;
  title: string;
  /** Calls are audio or video; the panel offers only what the service allows. */
  mode: 'audio' | 'video';
  scheduledStart: string;
  durationMin: number;
  status: 'scheduled' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  /** In-progress is always joinable; otherwise from 5 min before the start. */
  joinable: boolean;
  proposedBy: 'provider' | 'patient';
};

export type ChannelDocument = {
  id: string;
  fileName: string;
  sizeLabel: string;
  uploadedBy: string;
  uploadedOn: string;
};

export type ServiceChannel = {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  serviceName: string;
  /** Group services share this across their group chat and every 1:1 leg. */
  groupId: string | null;
  counterparts: Counterpart[];
  status: ChannelStatus;
  validUntil: string;
  daysLeft: number;
  unread: number;
  lastMessage: string;
  lastTime: string;
  /** Terms snapshotted at purchase — the channel's own, not the product's. */
  comms: CommsConfig;
  audioMinutesUsed: number;
  videoMinutesUsed: number;
  /** Patient messages already sent against the quota. */
  messagesUsed: number;
  /** …and how many of those were today, against the daily cap. */
  messagesToday: number;
  videoCallsUsed: number;
  audioCallsUsed: number;
  /** Days of the term already elapsed. */
  daysUsed?: number;
  messages: ChannelMessage[];
  calls: ScheduledCall[];
  documents: ChannelDocument[];
};

/**
 * Which product kinds run as a *delivered service* rather than a single
 * appointment. All four execute over time, so all four can carry a channel:
 *
 *   service        → 1:1 with the provider
 *   recovery_plan  → 1:1, same shape as a service
 *   group_offering → group chat + a private leg per provider
 *   advanced_plan  → group chat + a private leg per provider (a care team)
 *
 * Only appointments are excluded: they're a single slot, and their execution
 * surface is the consultation room, not a channel.
 */
export const canOpenChannel = (_kind: ProductKind) => true;

/** Group-shaped products open one channel per provider plus a group thread. */
export const isTeamProduct = (kind: ProductKind) =>
  kind === 'group_offering' || kind === 'advanced_plan';

const NO_COMMS: CommsConfig = {
  isEnabled: false,
  chat: false,
  audio: false,
  video: false,
  documents: false,
  forms: false,
  audioMinutesQuota: 0,
  videoMinutesQuota: 0,
  messageQuota: 0,
  messagesPerDay: 0,
  videoCallsIncluded: 0,
  audioCallsIncluded: 0,
  emergencyEnabled: false,
  maxAttachmentMb: 0,
  planDays: 0,
};

/**
 * What each kind of product includes by default. The admin sets this per
 * product on the web; these presets stand in until that config is available.
 *
 * Recovery plans and longevity/advanced plans both run for weeks or months
 * with real clinical contact, so both get chat, calls and document exchange —
 * a plan you can't reach anyone through isn't a plan.
 */
export const COMMS_PRESET: Record<ProductKind, CommsConfig> = {
  // A consultation opens a channel too, but only for the length of its slot:
  // chat and the call surface while it runs, files so a report can be handed
  // over, and no quota because the slot itself is the limit.
  appointment: {
    isEnabled: true,
    chat: true,
    audio: true,
    video: true,
    documents: true,
    forms: false,
    audioMinutesQuota: null,
    videoMinutesQuota: null,
    // A consult is one short conversation, not an open channel.
    messageQuota: 5,
    messagesPerDay: null,
    videoCallsIncluded: 1,
    audioCallsIncluded: 0,
    emergencyEnabled: false,
    // A consultation is one slot, not a term — so no days at all.
    maxAttachmentMb: 10,
    planDays: 0,
  },
  service: {
    isEnabled: true,
    chat: true,
    audio: true,
    video: true,
    documents: true,
    forms: false,
    audioMinutesQuota: 60,
    videoMinutesQuota: 60,
    messageQuota: 50,
    messagesPerDay: 10,
    videoCallsIncluded: 3,
    audioCallsIncluded: 4,
    emergencyEnabled: true,
    maxAttachmentMb: 10,
    planDays: 84,
  },
  recovery_plan: {
    isEnabled: true,
    chat: true,
    audio: true,
    video: true,
    documents: true,
    forms: true,
    audioMinutesQuota: 90,
    videoMinutesQuota: 60,
    messageQuota: 50,
    messagesPerDay: 10,
    videoCallsIncluded: 3,
    audioCallsIncluded: 5,
    emergencyEnabled: true,
    maxAttachmentMb: 10,
    planDays: 21,
  },
  group_offering: {
    isEnabled: true,
    chat: true,
    audio: true,
    video: true,
    documents: true,
    forms: false,
    audioMinutesQuota: 120,
    videoMinutesQuota: 120,
    messageQuota: 100,
    messagesPerDay: 15,
    videoCallsIncluded: 5,
    audioCallsIncluded: 7,
    emergencyEnabled: true,
    maxAttachmentMb: 10,
    planDays: 56,
  },
  advanced_plan: {
    // Longevity and advanced care run longest and involve the largest team,
    // so they're unmetered rather than quota'd.
    isEnabled: true,
    chat: true,
    audio: true,
    video: true,
    documents: true,
    forms: true,
    audioMinutesQuota: null,
    videoMinutesQuota: null,
    messageQuota: null,
    messagesPerDay: 25,
    videoCallsIncluded: 12,
    audioCallsIncluded: 12,
    emergencyEnabled: true,
    maxAttachmentMb: 25,
    planDays: 365,
  },
};

export const commsFor = (kind: ProductKind): CommsConfig => COMMS_PRESET[kind] ?? NO_COMMS;

/**
 * A second opinion with your own family doctor.
 *
 * It isn't a plan and isn't an appointment: it's a short, bounded conversation
 * about one prescription. So it opens a real channel — chat, voice and video,
 * documents — but a tightly metered one, and the patient can top any of them up
 * rather than being cut off mid-question.
 */
/**
 * How long the free follow-up stays open after a booking completes.
 *
 * Long enough to cover the questions that surface once the patient is home and
 * has started the medicine; short enough that it stays a follow-up on *that*
 * consultation rather than becoming untracked, unpaid care indefinitely.
 */
export const SECOND_OPINION_WINDOW_DAYS = 14;

/**
 * A pre-existing second-opinion conversation, as the sample data describes it.
 *
 * Deliberately plainer than ServiceChannel: the data file says what was said
 * and what has been used up, and this module turns that into a channel — ids,
 * sender names and joinability are ours to derive, not the data's to repeat.
 */
export type SecondOpinionSeed = {
  messagesUsed?: number;
  messagesToday?: number;
  videoCallsUsed?: number;
  audioCallsUsed?: number;
  unread?: number;
  messages?: {
    from: 'me' | 'them';
    text: string;
    time: string;
    kind?: 'text' | 'document';
  }[];
  documents?: {
    fileName: string; sizeLabel: string; uploadedBy: string; uploadedOn: string;
  }[];
  calls?: {
    title: string;
    mode: 'audio' | 'video';
    scheduledStart: string;
    durationMin: number;
    status: ScheduledCall['status'];
  }[];
};

export const SECOND_OPINION_COMMS: CommsConfig = {
  isEnabled: true,
  chat: true,
  audio: true,
  video: true,
  documents: true,
  forms: false,
  audioMinutesQuota: 5,
  videoMinutesQuota: 5,
  messageQuota: 5,
  messagesPerDay: 5,
  videoCallsIncluded: 1,
  audioCallsIncluded: 1,
  emergencyEnabled: false,
  maxAttachmentMb: 10,
  // A second opinion is bounded by its free window, not by a plan term.
  planDays: 0,
};

/** A product opens a channel when its kind runs over time and comms are on. */
export const productHasChat = (kind: ProductKind, _name?: string) =>
  canOpenChannel(kind) && commsFor(kind).isEnabled;

/**
 * What a given channel can actually do.
 *
 * A 1:1 leg is bounded by that one provider's slot — a chat-only dietitian's
 * thread must not offer a call button just because the plan as a whole
 * includes video. A group thread takes the union, because the call happens
 * with whichever member runs it.
 *
 * Both are then clamped by the purchase-level terms, so a product that never
 * sold calls can't gain them from a slot config.
 */
export function effectiveComms(c: ServiceChannel): CommsConfig {
  const any = (f: (p: Counterpart) => boolean) => c.counterparts.some(f);
  const slotChat = any((p) => p.chat);
  const slotVoice = any((p) => p.voice);
  const slotVideo = any((p) => p.video);
  return {
    ...c.comms,
    chat: c.comms.chat && slotChat,
    audio: c.comms.audio && slotVoice,
    video: c.comms.video && slotVideo,
  };
}

/** Consultations included across a channel's providers, and how many are spent. */
export function consultationAllowance(c: ServiceChannel) {
  const rows = c.counterparts.filter((p) => (p.maxConsultations ?? 0) > 0);
  if (!rows.length) return null;
  return {
    max: rows.reduce((n, p) => n + (p.maxConsultations ?? 0), 0),
    used: rows.reduce((n, p) => n + (p.consultationsUsed ?? 0), 0),
  };
}

/**
 * Messages the patient may still send. null means unmetered.
 *
 * `extra` is what they've sent in this session but the server hasn't seen yet,
 * so the counter moves as they type rather than lying until a refresh.
 */
export function messagesLeft(c: ServiceChannel, extra = 0): number | null {
  const quota = c.comms.messageQuota;
  if (quota == null) return null;
  return Math.max(0, quota - c.messagesUsed - extra);
}

/**
 * Days left on a day-based plan, or null when the product has no term.
 *
 * Derived rather than stored so buying more days and the counter can't
 * disagree: `planDays` is what was sold (including any extension), `daysUsed`
 * is what has elapsed.
 */
export function daysLeft(c: ServiceChannel): number | null {
  if (!c.comms.planDays) return null;
  return Math.max(0, c.comms.planDays - (c.daysUsed ?? 0));
}

/** Minutes left against a quota; null quota means unmetered. */
export const minutesLeft = (quota: number | null, used: number) =>
  (quota == null ? null : Math.max(0, quota - used));

export function validityLabel(c: ServiceChannel): string {
  if (c.status !== 'active' || c.daysLeft < 0) return 'Ended';
  if (c.daysLeft === 0) return 'Ends today';
  return `${c.daysLeft} day${c.daysLeft === 1 ? '' : 's'} left`;
}

export const serviceChannels: ServiceChannel[] = [
  // ── A 1:1 service ────────────────────────────────────────────────────
  {
    id: 'ch1',
    kind: 'direct',
    title: 'Dr. Neha Kulkarni',
    serviceName: 'Diet & Nutrition Programme — 12 weeks',
    groupId: null,
    counterparts: [{ name: 'Dr. Neha Kulkarni', role: 'Clinical Nutritionist', chat: true, voice: true, video: true, minConsultations: 4, maxConsultations: 8, consultationsUsed: 2, voiceMinutes: [10, 30], videoMinutes: [15, 45], avatar: 'https://i.pravatar.cc/150?img=32' }],
    status: 'active',
    validUntil: '2026-11-08',
    daysLeft: 83,
    unread: 2,
    lastMessage: 'Send me this week’s food log whenever you can.',
    lastTime: '10:12',
    comms: COMMS_PRESET.service,
    audioMinutesUsed: 18,
    videoMinutesUsed: 30,
    messagesUsed: 12,
    messagesToday: 3,
    videoCallsUsed: 1,
    audioCallsUsed: 0,
    daysUsed: 22,
    messages: [
      { id: 'm1', kind: 'system', from: 'them', text: 'Channel opened — Diet & Nutrition Programme', time: '14 Aug' },
      { id: 'm2', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'Welcome Rohit! I’ve looked through your vitals and lipid profile.', time: '14 Aug' },
      { id: 'm3', kind: 'text', from: 'me', text: 'Thank you. Should I stop the evening snack entirely?', time: '14 Aug' },
      { id: 'm4', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'No — swap it rather than skip it. I’ll share a chart.', time: '15 Aug' },
      { id: 'm5', kind: 'document', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'Week1_Meal_Plan.pdf', time: '15 Aug' },
      { id: 'm6', kind: 'text', from: 'them', senderName: 'Nurse Kavya', text: 'Reminder: your review call is on Thursday.', time: '10:10', onBehalfOf: 'Dr. Neha Kulkarni' },
      { id: 'm7', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'Send me this week’s food log whenever you can.', time: '10:12' },
    ],
    calls: [
      {
        id: 'sc1', title: 'Week 2 review', mode: 'video', scheduledStart: '2026-08-20 · 17:00',
        durationMin: 20, status: 'scheduled', joinable: false, proposedBy: 'provider',
      },
      {
        id: 'sc2', title: 'Onboarding call', mode: 'audio', scheduledStart: '2026-08-14 · 11:00',
        durationMin: 30, status: 'completed', joinable: false, proposedBy: 'provider',
      },
    ],
    documents: [
      { id: 'cd1', fileName: 'Week1_Meal_Plan.pdf', sizeLabel: '412 KB', uploadedBy: 'Dr. Neha Kulkarni', uploadedOn: '2026-08-15' },
      { id: 'cd2', fileName: 'Food_Log_Week1.jpg', sizeLabel: '1.2 MB', uploadedBy: 'You', uploadedOn: '2026-08-16' },
    ],
  },

  // ── A group service: group chat + one leg per doctor ─────────────────
  {
    id: 'ch2',
    kind: 'group',
    title: 'Group chat',
    serviceName: 'Diabetes Group Coaching — 8 weeks',
    groupId: 'g1',
    counterparts: [
      { name: 'Dr. Anitha Rao', role: 'Endocrinologist', chat: true, voice: true, video: true, minConsultations: 2, maxConsultations: 6, consultationsUsed: 3, voiceMinutes: [10, 20], videoMinutes: [15, 45], avatar: 'https://i.pravatar.cc/150?img=47' },
      { name: 'Dr. Neha Kulkarni', role: 'Nutritionist', chat: true, voice: false, video: false, minConsultations: 0, maxConsultations: 0, consultationsUsed: 0, avatar: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Ravi Menon', role: 'Fitness Coach', chat: true, voice: true, video: false, minConsultations: 2, maxConsultations: 4, consultationsUsed: 1, voiceMinutes: [10, 30], avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    status: 'active',
    validUntil: '2026-10-10',
    daysLeft: 54,
    unread: 5,
    lastMessage: 'Ravi: Group walk this Saturday at 6am, Cubbon Park.',
    lastTime: '09:40',
    comms: COMMS_PRESET.group_offering,
    audioMinutesUsed: 0,
    videoMinutesUsed: 45,
    messagesUsed: 31,
    messagesToday: 3,
    videoCallsUsed: 1,
    audioCallsUsed: 1,
    daysUsed: 17,
    messages: [
      { id: 'g1m1', kind: 'system', from: 'them', text: 'Group opened — 3 providers, 12 participants', time: '01 Aug' },
      { id: 'g1m2', kind: 'text', from: 'them', senderName: 'Dr. Anitha Rao', text: 'Welcome everyone. We meet twice a week, and this thread stays open throughout.', time: '01 Aug' },
      { id: 'g1m3', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'I’ll post the shared meal framework here — individual tweaks in your 1:1 thread.', time: '02 Aug' },
      { id: 'g1m4', kind: 'text', from: 'me', text: 'Is the Saturday session in person?', time: '09:38' },
      { id: 'g1m5', kind: 'text', from: 'them', senderName: 'Ravi Menon', text: 'Group walk this Saturday at 6am, Cubbon Park.', time: '09:40' },
    ],
    calls: [
      {
        id: 'sc3', title: 'Weekly group session', mode: 'video', scheduledStart: '2026-08-17 · 18:30',
        durationMin: 45, status: 'in_progress', joinable: true, proposedBy: 'provider',
      },
    ],
    documents: [
      { id: 'cd3', fileName: 'Diabetes_Handbook.pdf', sizeLabel: '2.8 MB', uploadedBy: 'Dr. Anitha Rao', uploadedOn: '2026-08-01' },
    ],
  },
  {
    id: 'ch3',
    kind: 'direct',
    title: 'Dr. Anitha Rao',
    serviceName: 'Diabetes Group Coaching — 8 weeks',
    groupId: 'g1',
    counterparts: [{ name: 'Dr. Anitha Rao', role: 'Endocrinologist', chat: true, voice: true, video: true, minConsultations: 2, maxConsultations: 6, consultationsUsed: 3, voiceMinutes: [10, 20], videoMinutes: [15, 45], avatar: 'https://i.pravatar.cc/150?img=47' }],
    status: 'active',
    validUntil: '2026-10-10',
    daysLeft: 54,
    unread: 0,
    lastMessage: 'Your fasting numbers are trending down. Keep going.',
    lastTime: 'Yesterday',
    comms: COMMS_PRESET.group_offering,
    audioMinutesUsed: 12,
    videoMinutesUsed: 0,
    messagesUsed: 4,
    messagesToday: 3,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'g1d1', kind: 'system', from: 'them', text: 'Private thread with Dr. Anitha Rao', time: '01 Aug' },
      { id: 'g1d2', kind: 'text', from: 'me', text: 'I’d rather discuss my medication privately than in the group.', time: '12 Aug' },
      { id: 'g1d3', kind: 'text', from: 'them', senderName: 'Dr. Anitha Rao', text: 'Of course — that’s exactly what this thread is for.', time: '12 Aug' },
      { id: 'g1d4', kind: 'text', from: 'them', senderName: 'Dr. Anitha Rao', text: 'Your fasting numbers are trending down. Keep going.', time: 'Yesterday' },
    ],
    calls: [],
    documents: [],
  },
  {
    id: 'ch4',
    kind: 'direct',
    title: 'Dr. Neha Kulkarni',
    serviceName: 'Diabetes Group Coaching — 8 weeks',
    groupId: 'g1',
    counterparts: [{ name: 'Dr. Neha Kulkarni', role: 'Nutritionist', chat: true, voice: false, video: false, minConsultations: 0, maxConsultations: 0, consultationsUsed: 0, avatar: 'https://i.pravatar.cc/150?img=32' }],
    status: 'active',
    validUntil: '2026-10-10',
    daysLeft: 54,
    unread: 1,
    lastMessage: 'Sent your personalised carb targets.',
    lastTime: '2 days ago',
    comms: COMMS_PRESET.group_offering,
    audioMinutesUsed: 0,
    videoMinutesUsed: 15,
    messagesUsed: 1,
    messagesToday: 1,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'g1n1', kind: 'system', from: 'them', text: 'Private thread with Dr. Neha Kulkarni', time: '01 Aug' },
      { id: 'g1n2', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'Sent your personalised carb targets.', time: '2 days ago' },
    ],
    calls: [],
    documents: [],
  },

  // ── A recovery plan: a service in every respect that matters ─────────
  {
    id: 'ch6',
    kind: 'direct',
    title: 'Dr. Anitha Rao',
    serviceName: 'Post-Dengue Strength Plan — 21 Days',
    groupId: null,
    counterparts: [{ name: 'Dr. Anitha Rao', role: 'General Physician', chat: true, voice: true, video: true, minConsultations: 2, maxConsultations: 5, consultationsUsed: 1, voiceMinutes: [5, 15], videoMinutes: [10, 30], avatar: 'https://i.pravatar.cc/150?img=47' }],
    status: 'active',
    validUntil: '2026-08-30',
    daysLeft: 13,
    unread: 3,
    lastMessage: 'Platelets are back in range. Two more days of rest, then we reassess.',
    lastTime: '08:15',
    comms: COMMS_PRESET.recovery_plan,
    audioMinutesUsed: 22,
    videoMinutesUsed: 15,
    messagesUsed: 9,
    messagesToday: 3,
    videoCallsUsed: 1,
    audioCallsUsed: 0,
    daysUsed: 8,
    messages: [
      { id: 'r1', kind: 'system', from: 'them', text: 'Recovery plan started — Day 1 of 21', time: '09 Aug' },
      { id: 'r2', kind: 'text', from: 'them', senderName: 'Dr. Anitha Rao', text: 'I’ll check in every morning. Log your temperature and platelet count here.', time: '09 Aug' },
      { id: 'r3', kind: 'text', from: 'me', text: 'Temp 99.1 this morning, feeling weak but no bleeding.', time: '10 Aug' },
      { id: 'r4', kind: 'text', from: 'them', senderName: 'Nurse Kavya', text: 'Noted. Keep fluids up — 3 litres today.', time: '10 Aug', onBehalfOf: 'Dr. Anitha Rao' },
      { id: 'r5', kind: 'document', from: 'me', text: 'CBC_Report_12Aug.pdf', time: '12 Aug' },
      { id: 'r6', kind: 'text', from: 'them', senderName: 'Dr. Anitha Rao', text: 'Platelets are back in range. Two more days of rest, then we reassess.', time: '08:15' },
    ],
    calls: [
      {
        id: 'sc4', title: 'Day 14 review', mode: 'video', scheduledStart: '2026-08-22 · 10:30',
        durationMin: 15, status: 'scheduled', joinable: false, proposedBy: 'provider',
      },
      {
        id: 'sc5', title: 'Day 3 check-in', mode: 'audio', scheduledStart: '2026-08-11 · 09:00',
        durationMin: 10, status: 'completed', joinable: false, proposedBy: 'provider',
      },
    ],
    documents: [
      { id: 'cd5', fileName: 'Recovery_Schedule_21d.pdf', sizeLabel: '318 KB', uploadedBy: 'Dr. Anitha Rao', uploadedOn: '2026-08-09' },
      { id: 'cd6', fileName: 'CBC_Report_12Aug.pdf', sizeLabel: '244 KB', uploadedBy: 'You', uploadedOn: '2026-08-12' },
    ],
  },

  // ── A longevity plan: a team product, so a group thread + private legs ─
  {
    id: 'ch7',
    kind: 'group',
    title: 'Care team',
    serviceName: 'Longevity & Healthy Ageing Plan — 12 Months',
    groupId: 'g2',
    counterparts: [
      { name: 'Dr. Kavya Nair', role: 'Longevity Lead', chat: true, voice: true, video: true, minConsultations: 4, maxConsultations: 12, consultationsUsed: 2, voiceMinutes: [15, 45], videoMinutes: [30, 90], avatar: 'https://i.pravatar.cc/150?img=44' },
      { name: 'Dr. Karthik Menon', role: 'Cardiologist', chat: true, voice: false, video: true, minConsultations: 2, maxConsultations: 4, consultationsUsed: 1, videoMinutes: [20, 60], avatar: 'https://i.pravatar.cc/150?img=53' },
      { name: 'Dr. Neha Kulkarni', role: 'Nutritionist', chat: true, voice: false, video: false, minConsultations: 0, maxConsultations: 0, consultationsUsed: 0, avatar: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Ravi Menon', role: 'Exercise Physiologist', chat: true, voice: true, video: false, minConsultations: 4, maxConsultations: 8, consultationsUsed: 2, voiceMinutes: [15, 30], avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    status: 'active',
    validUntil: '2027-08-01',
    daysLeft: 349,
    unread: 4,
    lastMessage: 'Dr. Kavya: Q1 marker panel is back — reviewing it as a team on Friday.',
    lastTime: '11:05',
    comms: COMMS_PRESET.advanced_plan,
    audioMinutesUsed: 95,
    videoMinutesUsed: 210,
    messagesUsed: 63,
    messagesToday: 3,
    videoCallsUsed: 1,
    audioCallsUsed: 1,
    daysUsed: 17,
    messages: [
      { id: 'l1', kind: 'system', from: 'them', text: 'Plan activated — care team of 4 assigned', time: '01 Aug' },
      { id: 'l2', kind: 'text', from: 'them', senderName: 'Dr. Kavya Nair', text: 'Welcome Rohit. Over 12 months we track ageing markers quarterly and adjust as we go.', time: '01 Aug' },
      { id: 'l3', kind: 'document', from: 'them', senderName: 'Dr. Kavya Nair', text: 'Baseline_Marker_Panel.pdf', time: '03 Aug' },
      { id: 'l4', kind: 'text', from: 'them', senderName: 'Dr. Karthik Menon', text: 'Your ApoB is the one number I want to move first. Nothing alarming.', time: '05 Aug' },
      { id: 'l5', kind: 'text', from: 'me', text: 'Understood. Should I change anything before the Friday review?', time: '10:58' },
      { id: 'l6', kind: 'text', from: 'them', senderName: 'Dr. Kavya Nair', text: 'Q1 marker panel is back — reviewing it as a team on Friday.', time: '11:05' },
    ],
    calls: [
      {
        id: 'sc6', title: 'Quarterly team review', mode: 'video', scheduledStart: '2026-08-21 · 16:00',
        durationMin: 60, status: 'accepted', joinable: false, proposedBy: 'provider',
      },
      {
        id: 'sc7', title: 'Baseline assessment', mode: 'video', scheduledStart: '2026-08-03 · 15:00',
        durationMin: 90, status: 'completed', joinable: false, proposedBy: 'provider',
      },
    ],
    documents: [
      { id: 'cd7', fileName: 'Baseline_Marker_Panel.pdf', sizeLabel: '1.9 MB', uploadedBy: 'Dr. Kavya Nair', uploadedOn: '2026-08-03' },
      { id: 'cd8', fileName: 'Nutrition_Protocol_Y1.pdf', sizeLabel: '760 KB', uploadedBy: 'Dr. Neha Kulkarni', uploadedOn: '2026-08-04' },
      { id: 'cd9', fileName: 'DEXA_Scan_Aug2026.pdf', sizeLabel: '3.1 MB', uploadedBy: 'You', uploadedOn: '2026-08-06' },
    ],
  },
  {
    id: 'ch8',
    kind: 'direct',
    title: 'Dr. Kavya Nair',
    serviceName: 'Longevity & Healthy Ageing Plan — 12 Months',
    groupId: 'g2',
    counterparts: [{ name: 'Dr. Kavya Nair', role: 'Longevity Lead', chat: true, voice: true, video: true, minConsultations: 4, maxConsultations: 12, consultationsUsed: 2, voiceMinutes: [15, 45], videoMinutes: [30, 90], avatar: 'https://i.pravatar.cc/150?img=44' }],
    status: 'active',
    validUntil: '2027-08-01',
    daysLeft: 349,
    unread: 0,
    lastMessage: 'Anything you’d rather not raise with the whole team, send here.',
    lastTime: '04 Aug',
    comms: COMMS_PRESET.advanced_plan,
    audioMinutesUsed: 8,
    videoMinutesUsed: 0,
    messagesUsed: 2,
    messagesToday: 2,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'l2a', kind: 'system', from: 'them', text: 'Private thread with Dr. Kavya Nair', time: '01 Aug' },
      { id: 'l2b', kind: 'text', from: 'them', senderName: 'Dr. Kavya Nair', text: 'Anything you’d rather not raise with the whole team, send here.', time: '04 Aug' },
    ],
    calls: [],
    documents: [],
  },
  {
    id: 'ch9',
    kind: 'direct',
    title: 'Dr. Karthik Menon',
    serviceName: 'Longevity & Healthy Ageing Plan — 12 Months',
    groupId: 'g2',
    counterparts: [{ name: 'Dr. Karthik Menon', role: 'Cardiologist', chat: true, voice: false, video: true, minConsultations: 2, maxConsultations: 4, consultationsUsed: 1, videoMinutes: [20, 60], avatar: 'https://i.pravatar.cc/150?img=53' }],
    status: 'active',
    validUntil: '2027-08-01',
    daysLeft: 349,
    unread: 1,
    lastMessage: 'Sent your lipid trend chart — compare it in three months.',
    lastTime: '06 Aug',
    comms: COMMS_PRESET.advanced_plan,
    audioMinutesUsed: 0,
    videoMinutesUsed: 25,
    messagesUsed: 3,
    messagesToday: 3,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'l3a', kind: 'system', from: 'them', text: 'Private thread with Dr. Karthik Menon', time: '01 Aug' },
      { id: 'l3b', kind: 'text', from: 'them', senderName: 'Dr. Karthik Menon', text: 'Sent your lipid trend chart — compare it in three months.', time: '06 Aug' },
    ],
    calls: [],
    documents: [],
  },
  {
    id: 'ch10',
    kind: 'direct',
    title: 'Dr. Neha Kulkarni',
    serviceName: 'Longevity & Healthy Ageing Plan — 12 Months',
    groupId: 'g2',
    counterparts: [{ name: 'Dr. Neha Kulkarni', role: 'Nutritionist', chat: true, voice: false, video: false, minConsultations: 0, maxConsultations: 0, consultationsUsed: 0, avatar: 'https://i.pravatar.cc/150?img=32' }],
    status: 'active',
    validUntil: '2027-08-01',
    daysLeft: 349,
    unread: 0,
    lastMessage: 'Protocol uploaded. Start from Monday.',
    lastTime: '04 Aug',
    comms: COMMS_PRESET.advanced_plan,
    audioMinutesUsed: 0,
    videoMinutesUsed: 0,
    messagesUsed: 0,
    messagesToday: 0,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'l4a', kind: 'system', from: 'them', text: 'Private thread with Dr. Neha Kulkarni', time: '01 Aug' },
      { id: 'l4b', kind: 'text', from: 'them', senderName: 'Dr. Neha Kulkarni', text: 'Protocol uploaded. Start from Monday.', time: '04 Aug' },
    ],
    calls: [],
    documents: [],
  },
  {
    id: 'ch11',
    kind: 'direct',
    title: 'Ravi Menon',
    serviceName: 'Longevity & Healthy Ageing Plan — 12 Months',
    groupId: 'g2',
    counterparts: [{ name: 'Ravi Menon', role: 'Exercise Physiologist', chat: true, voice: true, video: false, minConsultations: 4, maxConsultations: 8, consultationsUsed: 2, voiceMinutes: [15, 30], avatar: 'https://i.pravatar.cc/150?img=12' }],
    status: 'active',
    validUntil: '2027-08-01',
    daysLeft: 349,
    unread: 0,
    lastMessage: 'Week 2 strength block is in your app.',
    lastTime: '05 Aug',
    comms: COMMS_PRESET.advanced_plan,
    audioMinutesUsed: 0,
    videoMinutesUsed: 0,
    messagesUsed: 0,
    messagesToday: 0,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    daysUsed: 17,
    messages: [
      { id: 'l5a', kind: 'system', from: 'them', text: 'Private thread with Ravi Menon', time: '01 Aug' },
      { id: 'l5b', kind: 'text', from: 'them', senderName: 'Ravi Menon', text: 'Week 2 strength block is in your app.', time: '05 Aug' },
    ],
    calls: [],
    documents: [],
  },

  // ── An ended service, kept read-only ─────────────────────────────────
  {
    id: 'ch5',
    kind: 'direct',
    title: 'Dr. Suresh Iyer',
    serviceName: 'Physiotherapy Package — 6 weeks',
    groupId: null,
    counterparts: [{ name: 'Dr. Suresh Iyer', role: 'Physiotherapist', chat: true, voice: true, video: true, minConsultations: 3, maxConsultations: 6, consultationsUsed: 6, voiceMinutes: [10, 20], videoMinutes: [20, 40], avatar: 'https://i.pravatar.cc/150?img=51' }],
    status: 'read_only',
    validUntil: '2026-07-20',
    daysLeft: -28,
    unread: 0,
    lastMessage: 'Programme complete. Keep up the home exercises.',
    lastTime: '20 Jul',
    comms: COMMS_PRESET.service,
    audioMinutesUsed: 40,
    videoMinutesUsed: 55,
    messagesUsed: 48,
    messagesToday: 3,
    videoCallsUsed: 1,
    audioCallsUsed: 1,
    daysUsed: 42,
    messages: [
      { id: 'p1', kind: 'system', from: 'them', text: 'Channel opened — Physiotherapy Package', time: '08 Jun' },
      { id: 'p2', kind: 'text', from: 'them', senderName: 'Dr. Suresh Iyer', text: 'Programme complete. Keep up the home exercises.', time: '20 Jul' },
      { id: 'p3', kind: 'system', from: 'them', text: 'Service ended — this thread is now read-only', time: '20 Jul' },
    ],
    calls: [],
    documents: [
      { id: 'cd4', fileName: 'Home_Exercise_Plan.pdf', sizeLabel: '890 KB', uploadedBy: 'Dr. Suresh Iyer', uploadedOn: '2026-07-20' },
    ],
  },
];

export const channelById = (id: string): ServiceChannel | null =>
  serviceChannels.find((c) => c.id === id)
  ?? [...generated.values()].find((c) => c.id === id)
  ?? null;

const productKey = (name: string) =>
  name.split('—')[0].split('–')[0].trim().toLowerCase().slice(0, 12);

/**
 * The channel for one purchased product — the existing thread if there is one,
 * otherwise a fresh one built from that product kind's terms.
 *
 * Every product delivered over time opens a channel at activation, so the
 * execution surface must not depend on whether this project happens to have
 * hand-written a conversation for it. Without this fallback three of four
 * in-progress plans showed no chat, calls or files at all, purely because
 * their sample threads didn't exist — an inconsistency the patient would read
 * as "this plan doesn't include messaging".
 */
/**
 * Channels built on demand are cached by key so the same object comes back
 * every time. Without this, anything the patient adds — a document, a reason
 * for the visit — would be written to a throwaway copy and vanish the moment
 * they navigated away.
 */
const generated = new Map<string, ServiceChannel>();

/** Today, as the sample data reckons it. */
const TODAY = '2026-08-18';

/**
 * The kinds that are genuinely delivered over several sessions.
 *
 * `service` is deliberately absent: it covers 12-week programmes *and* one-off
 * items — a lab report review, a home sample collection, an add-on call bought
 * from the allowance panel. Giving those a two-call schedule would promise a
 * course of care against a ₹199 prescription refill.
 */
const MULTI_SESSION: ProductKind[] = ['recovery_plan', 'group_offering', 'advanced_plan'];

/** A `2026-08-22 · 10:30` stamp, as opposed to `now` or `at your slot time`. */
const DATED = /^\d{4}-\d{2}-\d{2}/;

/**
 * A plan's calls in the order they actually happen.
 *
 * The sample threads list the upcoming call first, which reads fine as a feed
 * but numbers the calls backwards: "Intro call 1" lands on the *latest* one
 * and "Intro call 2" on a call that already finished. Numbering has to follow
 * the calendar, or the patient is told their first intro call is still ahead
 * of a second one they've already taken.
 *
 * Calls with no date — an emergency call "within 30 minutes", a consult "at
 * your slot time" — can't be sorted against dated ones, so they keep their
 * position at the front. An emergency is bought precisely because it's the
 * next thing to happen, and dropping the whole sort because one call is
 * undated would silently restore the backwards numbering.
 */
export function orderedCalls(calls: ScheduledCall[]): ScheduledCall[] {
  if (calls.length < 2) return calls;
  const undated = calls.filter((c) => !DATED.test(c.scheduledStart));
  const dated = calls.filter((c) => DATED.test(c.scheduledStart))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  return [...undated, ...dated];
}

/**
 * What to call one row in a call list.
 *
 * "Intro call 2" only means something inside a numbered series, so the number
 * is earned rather than assumed: a plan's scheduled calls get one, and
 * anything else keeps its own name. Without this a one-off consultation is
 * announced as the first of a course the patient never bought, and an
 * emergency call bought at 2am is labelled "Intro call 1".
 *
 * Both the booking screen and the conversation screen label through here, so
 * the same call can't be named two different things in two places.
 */
export function callLabel(calls: ScheduledCall[], index: number): string {
  const c = calls[index];
  if (!c) return '';
  if (!DATED.test(c.scheduledStart)) return c.title;
  const dated = calls.filter((x) => DATED.test(x.scheduledStart));
  if (dated.length < 2) return c.title;
  return `Intro call ${dated.indexOf(c) + 1}${c.title ? ` · ${c.title}` : ''}`;
}

/** `2026-08-18` + 4 → `2026-08-22 · 10:30`, matching the hand-written calls. */
function callStamp(dayOffset: number, time: string): string {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return `${d.toISOString().slice(0, 10)} · ${time}`;
}

/**
 * The intro calls for a plan the project hasn't hand-written a thread for.
 *
 * A plan is *delivered* through its scheduled calls, so a plan channel with an
 * empty call list tells the patient their plan includes none — the same wrong
 * signal the fallback channel above exists to prevent. One call behind and one
 * ahead is how the hand-written plans read, and it gives the "next scheduled
 * call for you" line something true to point at.
 *
 * Deterministic in the product key: the same plan must not show a different
 * schedule each time it's opened.
 */
function introCalls(
  key: string,
  mode: 'audio' | 'video',
  /**
   * Whether the plan is actually running. A plan that hasn't started has no
   * calls behind it — showing a "completed" onboarding call on a booking the
   * provider hasn't even accepted invents care that never happened.
   */
  started: boolean,
): ScheduledCall[] {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const spread = Math.abs(h);
  const ahead = 2 + (spread % 5);            // 2–6 days out
  const behind = -(4 + ((spread >> 3) % 6)); // 4–9 days back
  const hour = 9 + ((spread >> 6) % 9);      // 09:00–17:30
  const half = (spread >> 11) % 2 ? '30' : '00';
  const at = `${String(hour).padStart(2, '0')}:${half}`;

  return [
    {
      id: `auto-call-${key}-1`,
      title: 'Onboarding call',
      mode: 'audio',
      // Behind them once the plan is running, ahead of them before it starts.
      scheduledStart: started ? callStamp(behind, '11:00') : callStamp(1, '11:00'),
      durationMin: 20,
      status: started ? 'completed' : 'scheduled',
      joinable: false,
      proposedBy: 'provider',
    },
    {
      id: `auto-call-${key}-2`,
      title: 'Progress review',
      mode,
      scheduledStart: callStamp(ahead, at),
      durationMin: 30,
      status: 'scheduled',
      // A plan's call opens at its time, not because the plan is running.
      joinable: false,
      proposedBy: 'provider',
    },
  ];
}

export function channelForProduct(
  kind: ProductKind,
  name: string,
  provider?: string,
  /** Slot length for a consult — what bounds its conversation. */
  slotMinutes?: number,
  /** Whether the booking is running right now, which decides if a call is live. */
  inProgress = false,
): ServiceChannel | null {
  const key = productKey(name);
  const hits = key ? serviceChannels.filter((c) => productKey(c.serviceName) === key) : [];
  if (hits.length) return hits.find((c) => c.kind === 'group') ?? hits[0];

  // Liveness is part of the identity: an upcoming consult and an in-progress
  // one for the same product must not share a cached call state, or whichever
  // was opened first decides whether the other's Join button works.
  const cacheKey = `${kind}:${key}:${inProgress ? 'live' : 'idle'}`;
  const cached = generated.get(cacheKey);
  if (cached) return cached;

  const comms = commsFor(kind);
  if (!comms.isEnabled) return null;

  const team = isTeamProduct(kind);
  const consult = kind === 'appointment';
  const lead = provider && provider !== 'Recovery plan' ? provider : 'Your care team';
  const slot: Counterpart = {
    name: lead,
    role: team ? 'Care team lead' : 'Provider',
    avatar: 'https://i.pravatar.cc/150?img=47',
    chat: comms.chat,
    voice: comms.audio,
    video: comms.video,
  };

  const built: ServiceChannel = {
    id: `auto-${key || kind}`,
    kind: team ? 'group' : 'direct',
    title: team ? 'Care team' : lead,
    serviceName: name,
    groupId: null,
    counterparts: [slot],
    status: 'active',
    // A consult's thread closes with the slot; a plan's runs for its term.
    validUntil: consult ? `end of this ${slotMinutes ?? 15}-minute consult` : '—',
    daysLeft: consult ? 0 : 1,
    unread: 0,
    lastMessage: 'No messages yet.',
    lastTime: '',
    comms,
    audioMinutesUsed: 0,
    videoMinutesUsed: 0,
    messagesUsed: 0,
    messagesToday: 0,
    videoCallsUsed: 0,
    audioCallsUsed: 0,
    messages: [{
      id: 'auto-1',
      kind: 'system',
      from: 'them',
      text: `Channel opened — ${name}`,
      time: '',
    }],
    // A consult that hasn't started yet has a scheduled call, not a live one.
    // Marking it live regardless is what put two Join buttons on an upcoming
    // booking — one from the appointment, one from the channel.
    calls: consult ? [{
      id: `auto-call-${key || kind}`,
      title: 'Consultation',
      mode: 'video',
      scheduledStart: inProgress ? 'now' : 'at your slot time',
      durationMin: slotMinutes ?? 15,
      status: inProgress ? 'in_progress' : 'scheduled',
      joinable: inProgress,
      proposedBy: 'provider',
    }] : (MULTI_SESSION.includes(kind)
      ? introCalls(key || kind, comms.video ? 'video' : 'audio', inProgress)
      : []),
    documents: [],
  };

  generated.set(cacheKey, built);
  return built;
}

/**
 * The second-opinion thread for one completed booking.
 *
 * Care doesn't end when the consultation does — the questions usually start
 * when the patient gets home and reads the prescription. So every completed
 * booking keeps a short thread open with a few free messages, and voice, video
 * or more messages can be bought against it. `doctorName` is who they're
 * asking: their own family doctor, or the doctor who treated them.
 */
export function secondOpinionChannel(opts: {
  bookingId: string;
  doctorName: string;
  productName: string;
  role?: string;
  /** How long ago the booking completed — the window counts from there. */
  daysSinceCompletion?: number;
  /**
   * An existing conversation for this second opinion.
   *
   * Without it every thread opens blank, which makes them all look alike and
   * hides the states that matter — half the allowance spent, a call already
   * taken, a report the doctor sent back.
   */
  seed?: SecondOpinionSeed;
}): ServiceChannel {
  const {
    bookingId, doctorName, productName,
    role = 'Family Doctor', daysSinceCompletion = 0, seed,
  } = opts;

  const cacheKey = `second_opinion:${bookingId}:${doctorName}`;
  const cached = generated.get(cacheKey);
  if (cached) return cached;

  const daysLeft = Math.max(0, SECOND_OPINION_WINDOW_DAYS - daysSinceCompletion);
  const quota = SECOND_OPINION_COMMS.messageQuota ?? 0;

  // The opening system line, then whatever the seed carries.
  const seeded: ChannelMessage[] = (seed?.messages ?? []).map((m, i) => ({
    id: `so-${bookingId}-m${i}`,
    kind: m.kind ?? 'text',
    from: m.from,
    senderName: m.from === 'them' ? doctorName : undefined,
    text: m.text,
    time: m.time,
  }));

  const last = seeded[seeded.length - 1];

  const built: ServiceChannel = {
    id: `so-${bookingId}`,
    kind: 'direct',
    title: doctorName,
    serviceName: `Second opinion — ${productName}`,
    groupId: null,
    counterparts: [{
      name: doctorName,
      role,
      avatar: 'https://i.pravatar.cc/150?img=47',
      chat: true,
      voice: true,
      video: true,
      voiceMinutes: [5, 5],
      videoMinutes: [5, 5],
    }],
    // The thread stays open past the window — what closes is the *free* part.
    // Marking it read-only would strand a patient who is willing to pay.
    status: 'active',
    validUntil: `${SECOND_OPINION_WINDOW_DAYS} days after the booking completed`,
    daysLeft,
    unread: seed?.unread ?? 0,
    lastMessage: last?.text ?? 'No messages yet.',
    lastTime: last?.time ?? '',
    comms: SECOND_OPINION_COMMS,
    audioMinutesUsed: 0,
    videoMinutesUsed: 0,
    // Past the window the free allowance is spent rather than hidden, so the
    // patient sees "0 of 5 left · Add 20 messages" instead of a dead end.
    messagesUsed: daysLeft > 0 ? (seed?.messagesUsed ?? 0) : quota,
    messagesToday: daysLeft > 0 ? (seed?.messagesToday ?? 0) : 0,
    videoCallsUsed: daysLeft > 0
      ? (seed?.videoCallsUsed ?? 0)
      : SECOND_OPINION_COMMS.videoCallsIncluded,
    audioCallsUsed: daysLeft > 0
      ? (seed?.audioCallsUsed ?? 0)
      : SECOND_OPINION_COMMS.audioCallsIncluded,
    messages: [
      {
        id: `so-${bookingId}-1`,
        kind: 'system',
        from: 'them',
        text: `Second opinion opened with ${doctorName} — ${productName}`,
        time: '',
      },
      ...seeded,
      // Closing the free window is part of the thread's history, so it's
      // recorded in it rather than only shown as a state somewhere else.
      ...(daysLeft > 0 ? [] : [{
        id: `so-${bookingId}-closed`,
        kind: 'system' as const,
        from: 'them' as const,
        text: `Free follow-up window closed — it ran for ${SECOND_OPINION_WINDOW_DAYS} days after this booking completed`,
        time: '',
      }]),
    ],
    calls: (seed?.calls ?? []).map((c, i) => ({
      id: `so-${bookingId}-c${i}`,
      title: c.title,
      mode: c.mode,
      scheduledStart: c.scheduledStart,
      durationMin: c.durationMin,
      status: c.status,
      joinable: c.status === 'in_progress',
      proposedBy: 'patient',
    })),
    documents: (seed?.documents ?? []).map((d, i) => ({
      id: `so-${bookingId}-d${i}`,
      fileName: d.fileName,
      sizeLabel: d.sizeLabel,
      uploadedBy: d.uploadedBy,
      uploadedOn: d.uploadedOn,
    })),
  };

  generated.set(cacheKey, built);
  return built;
}

/**
 * Apply an add-on the patient has just paid for.
 *
 * Without this the top-up is a dead end: the panel says "your allowance is
 * spent, add 20 messages", the patient pays, and the composer is still locked.
 * Buying has to move the number it was sold against.
 *
 * `comms` is a shared preset object, so it's replaced rather than mutated —
 * otherwise topping up one booking would silently top up every booking of the
 * same kind.
 */
export function grantAddOn(
  channelId: string,
  key: 'chat' | 'video' | 'audio' | 'days' | 'emergency',
  units = 1,
): boolean {
  const c = channelById(channelId);
  if (!c) return false;

  if (key === 'chat') {
    const added = 20 * units;
    c.comms = {
      ...c.comms,
      messageQuota: c.comms.messageQuota == null ? null : c.comms.messageQuota + added,
      // Messages they bought shouldn't be held behind the free daily cap.
      messagesPerDay: c.comms.messagesPerDay == null ? null : c.comms.messagesPerDay + added,
    };
    c.messagesToday = 0;
    c.messages.push({
      id: `grant-${c.messages.length}`,
      kind: 'system',
      from: 'them',
      text: `${added} messages added to this conversation`,
      time: 'just now',
    });
  } else if (key === 'days') {
    const added = 30 * units;
    c.comms = { ...c.comms, planDays: c.comms.planDays + added };
    // The term is longer, so a channel that had run out is live again.
    if (c.status === 'read_only') c.status = 'active';
    c.daysLeft = Math.max(0, c.comms.planDays - (c.daysUsed ?? 0));
    c.messages.push({
      id: `grant-${c.messages.length}`,
      kind: 'system',
      from: 'them',
      text: `${added} days added — this plan now runs for ${c.comms.planDays} days`,
      time: 'just now',
    });
  } else if (key === 'video' || key === 'audio') {
    const video = key === 'video';
    c.comms = {
      ...c.comms,
      videoCallsIncluded: c.comms.videoCallsIncluded + (video ? units : 0),
      audioCallsIncluded: c.comms.audioCallsIncluded + (video ? 0 : units),
      videoMinutesQuota: video && c.comms.videoMinutesQuota != null
        ? c.comms.videoMinutesQuota + 5 * units : c.comms.videoMinutesQuota,
      audioMinutesQuota: !video && c.comms.audioMinutesQuota != null
        ? c.comms.audioMinutesQuota + 5 * units : c.comms.audioMinutesQuota,
    };
    c.messages.push({
      id: `grant-${c.messages.length}`,
      kind: 'system',
      from: 'them',
      text: `${units} ${video ? 'video' : 'voice'} call added to this conversation`,
      time: 'just now',
    });
  } else {
    // An emergency call isn't an allowance — it's a call, raised now.
    c.calls.unshift({
      id: `emg-${c.calls.length}`,
      title: 'Emergency call',
      mode: 'audio',
      scheduledStart: 'within 30 minutes',
      durationMin: 15,
      status: 'scheduled',
      joinable: false,
      proposedBy: 'patient',
    });
    c.messages.push({
      id: `grant-${c.messages.length}`,
      kind: 'system',
      from: 'them',
      text: 'Emergency call requested — an on-call doctor will join within 30 minutes',
      time: 'just now',
    });
  }

  return true;
}

/** Post into a thread — used when the patient updates something on a booking. */
export function appendMessage(
  channelId: string,
  text: string,
  kind: ChannelMessage['kind'] = 'text',
): void {
  const c = channelById(channelId);
  if (!c) return;
  c.messages.push({
    id: `local-${c.messages.length}-${text.length}`,
    kind,
    from: 'me',
    text,
    time: 'just now',
  });
  c.lastMessage = text;
  c.lastTime = 'just now';
}

/** Attach a file to a thread's shared documents. */
export function attachDocument(channelId: string, fileName: string, sizeLabel = '—'): void {
  const c = channelById(channelId);
  if (!c) return;
  c.documents.push({
    id: `local-doc-${c.documents.length}`,
    fileName,
    sizeLabel,
    uploadedBy: 'You',
    uploadedOn: 'just now',
  });
}

/** Group services cluster under one heading; 1:1 services stand alone. */
export function groupedChannels(): { key: string; heading: string | null; channels: ServiceChannel[] }[] {
  const out: { key: string; heading: string | null; channels: ServiceChannel[] }[] = [];
  const seen = new Set<string>();

  serviceChannels.forEach((c) => {
    if (c.groupId) {
      if (seen.has(c.groupId)) return;
      seen.add(c.groupId);
      out.push({
        key: c.groupId,
        heading: c.serviceName,
        channels: serviceChannels.filter((x) => x.groupId === c.groupId),
      });
    } else {
      out.push({ key: c.id, heading: null, channels: [c] });
    }
  });

  return out;
}

export const totalUnread = () => serviceChannels.reduce((n, c) => n + c.unread, 0);
