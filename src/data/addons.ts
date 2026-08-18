import { Ionicons } from '@expo/vector-icons';
import { daysLeft, ServiceChannel, effectiveComms, messagesLeft } from './channels';
import { colors } from '../theme/theme';

/**
 * What a patient can buy on top of what their booking already includes.
 *
 * Every purchase ships with a committed allowance — so many messages, so many
 * video and voice calls. Beyond that the care doesn't stop being available,
 * it just stops being free: the patient tops up. And when something can't
 * wait, an emergency call can be raised against any plan that permits it.
 *
 * These are ordinary products, so buying one goes through the same checkout as
 * anything else rather than inventing a second way to take money.
 */

export type AddOnKey = 'chat' | 'video' | 'audio' | 'days' | 'emergency';

export type AddOn = {
  key: AddOnKey;
  name: string;
  /** What one unit buys. */
  unit: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

export const ADD_ONS: Record<AddOnKey, AddOn> = {
  chat: {
    key: 'chat',
    name: 'Extra messages',
    unit: '20 messages',
    description: 'Adds 20 messages to this booking. They never expire before the booking does.',
    price: 199,
    icon: 'chatbubble-ellipses-outline',
    tint: colors.primary,
  },
  video: {
    key: 'video',
    name: 'Extra video call',
    unit: '1 video call',
    description: 'One more scheduled video consultation with your provider.',
    price: 499,
    icon: 'videocam-outline',
    tint: colors.secondary,
  },
  audio: {
    key: 'audio',
    name: 'Extra voice call',
    unit: '1 voice call',
    description: 'One more scheduled voice consultation with your provider.',
    price: 299,
    icon: 'call-outline',
    tint: colors.success,
  },
  days: {
    key: 'days',
    name: 'Extend the plan',
    unit: '30 more days',
    description:
      'Adds 30 days to this plan. Your care team, messages and calls carry on '
      + 'under the same terms — nothing restarts.',
    price: 1999,
    icon: 'calendar-outline',
    tint: colors.warningDark,
  },
  emergency: {
    key: 'emergency',
    name: 'Emergency call',
    unit: 'Within 30 minutes',
    description:
      'Connects you to an on-call doctor from your care team within 30 minutes, '
      + 'day or night. Charged once, on top of your plan.',
    price: 1499,
    icon: 'medkit-outline',
    tint: colors.error,
  },
};

/** One line of the allowance panel. */
export type Allowance = {
  key: AddOnKey;
  label: string;
  used: number;
  total: number | null;
  /** Secondary cap, e.g. the daily message limit. */
  subLabel?: string;
  subUsed?: number;
  subTotal?: number | null;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

/**
 * What this booking includes and what's left of it.
 *
 * Only capabilities the purchase actually sold appear — a chat-only slot has
 * no call rows to run down.
 */
export function allowancesFor(c: ServiceChannel): Allowance[] {
  const caps = effectiveComms(c);
  const out: Allowance[] = [];

  if (caps.chat) {
    out.push({
      key: 'chat',
      label: 'Messages',
      used: c.messagesUsed,
      total: caps.messageQuota,
      subLabel: caps.messagesPerDay != null ? 'Today' : undefined,
      subUsed: c.messagesToday,
      subTotal: caps.messagesPerDay,
      icon: 'chatbubble-outline',
      tint: colors.primary,
    });
  }
  if (caps.video) {
    out.push({
      key: 'video',
      label: 'Video calls',
      used: c.videoCallsUsed,
      total: caps.videoCallsIncluded,
      icon: 'videocam-outline',
      tint: colors.secondary,
    });
  }
  if (caps.audio) {
    out.push({
      key: 'audio',
      label: 'Voice calls',
      used: c.audioCallsUsed,
      total: caps.audioCallsIncluded,
      icon: 'call-outline',
      tint: colors.success,
    });
  }

  // Days are only meaningful for a product with a term. The backend says zero
  // for a single consultation, and then the row isn't shown at all — "0 of 0
  // days left" on a video consult is noise pretending to be information.
  if (caps.planDays > 0) {
    out.push({
      key: 'days',
      label: 'Days left',
      used: c.daysUsed ?? 0,
      total: caps.planDays,
      icon: 'calendar-outline',
      tint: colors.warningDark,
    });
  }
  return out;
}

export const remaining = (a: Allowance) =>
  (a.total == null ? null : Math.max(0, a.total - a.used));

export const dailyRemaining = (a: Allowance) =>
  (a.subTotal == null ? null : Math.max(0, a.subTotal - (a.subUsed ?? 0)));

/** True when the patient has hit today's cap but still has term allowance. */
export function dailyCapReached(c: ServiceChannel, sentToday = 0): boolean {
  const cap = effectiveComms(c).messagesPerDay;
  if (cap == null) return false;
  return c.messagesToday + sentToday >= cap;
}

/** Whether anything is left to send right now, and why not if not. */
export function chatBlockReason(
  c: ServiceChannel,
  sentThisSession = 0,
): 'quota' | 'daily' | null {
  if ((messagesLeft(c, sentThisSession) ?? 1) <= 0) return 'quota';
  if (dailyCapReached(c, sentThisSession)) return 'daily';
  return null;
}
