import { Ionicons } from '@expo/vector-icons';
import { isExtended } from './extensions';
import { hasRecordsAccess } from './recordsAccess';
import { SECOND_OPINION_WINDOW_DAYS, secondOpinionChannel } from './channels';
import {
  appointments, familyDoctor, planBookings, productCategories, recoveryPlanOrders,
  secondOpinionBookings,
} from './mock';
import { colors } from '../theme/theme';

/**
 * A booking's lifecycle state means different things in each product type —
 * a consult is "upcoming", a recovery plan is "in_process", a care plan is
 * "active". These helpers flatten all three onto one status axis.
 */
/**
 * A booking's life, in the order it actually happens.
 *
 * Paying does not confirm anything: the provider has to accept first, so a
 * booking starts in `pending` — either waiting on them, or waiting on payment
 * when someone else raised it. Once accepted it becomes `upcoming`, then runs,
 * then finishes.
 *
 * A booking the provider declines is closed rather than live, so it lands in
 * `completed` carrying a "Cancelled" tag. It still owes the patient their
 * money back, and the app has to say so.
 */
export type ViewKey =
  | 'pending' | 'upcoming' | 'in_progress' | 'free_followup' | 'completed'
  | 'second_opinion' | 'cancelled';

/** Today, as the sample data reckons it. */
const TODAY = '2026-08-18';

/**
 * Whether a finished booking still has its free follow-up window open.
 *
 * Care doesn't end when the consultation does — the questions start when the
 * patient gets home and reads the prescription. Every finished booking keeps a
 * short thread open with a few free messages, and while that lasts the booking
 * isn't really "completed" to the patient: there's still something they can
 * use. So it sits in its own head until the window closes, then moves on.
 *
 * A booking with no finish date can't be given a window it might not have —
 * treated as closed rather than promising free care the data can't support.
 */
export function freeFollowUpOpen(completedOn?: string): boolean {
  const then = Date.parse(completedOn ?? '');
  if (Number.isNaN(then)) return false;
  return daysBetween(completedOn) < SECOND_OPINION_WINDOW_DAYS;
}

/** Whole days from a date to today. Unparseable reads as long past. */
function daysBetween(iso?: string): number {
  const then = Date.parse(iso ?? '');
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((Date.parse(TODAY) - then) / 86_400_000));
}

/** `video_consultation` -> `Video Consultation`. */
const prettify = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export type OwnerKind = 'self' | 'minor' | 'family';

export type UnifiedBooking = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  kindLabel: 'Consultation' | 'Recovery Plan' | 'Advanced Care' | 'Second Opinion';
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** Where tapping the row goes. */
  route: string;
  /** Who the booking is for — the household sees everyone's in one list. */
  ownerKind: OwnerKind;
  ownerName: string;
  /** Which product category this came from, so one list can be filtered. */
  categoryKey: string;
  categoryLabel: string;
  /** Slot length for a consult; undefined for a plan, which runs by term. */
  slotMinutes?: number;
  /** Why a pending booking is waiting — nobody should have to guess. */
  awaiting?: 'provider' | 'payment';
  /** Set when the provider declined, which is what triggers a refund. */
  rejected?: boolean;
  /** What the patient paid, so a refund can name the figure. */
  paidAmount?: number;
  /** Who raised it, when that wasn't the patient themselves. */
  raisedBy?: string;
  /** Whether the provider can see the health record for this booking. */
  recordsShared: boolean;
  /** When the booking finished — what the free follow-up window counts from. */
  completedOn?: string;
};

/**
 * Which household member each booking belongs to. The backend carries this on
 * the row itself; until this is wired up it lives here so the dashboard totals
 * can be broken down by person.
 */
const OWNERS: Record<string, { kind: OwnerKind; name: string }> = {
  a2: { kind: 'family', name: 'Venkat Reddy' },
  a5: { kind: 'minor', name: 'Arjun Reddy' },
  a6: { kind: 'family', name: 'Meena Reddy' },
  ro3: { kind: 'minor', name: 'Aarohi Reddy' },
  ro4: { kind: 'family', name: 'Meena Reddy' },
};

/**
 * Bookings someone else raised on the patient's behalf — support staff, a
 * linked family member, the clinic desk. These reach the patient unpaid, so
 * they wait on money rather than on the provider.
 */
const RAISED_BY: Record<string, { by: string; unpaid?: boolean }> = {
  a18: { by: 'Larazen support staff', unpaid: true },
  pb5: { by: 'Larazen support staff', unpaid: true },
  a15: { by: 'Meena Reddy' },
};

const SELF_OWNER = { kind: 'self' as OwnerKind, name: 'Rohit Reddy' };
const ownerOf = (id: string) => OWNERS[id] ?? SELF_OWNER;

/** Category label straight from the catalogue, so the filter matches the shelf. */
const labelFor = (key: string) =>
  productCategories.find((c) => c.key === key)?.name ?? key;

export const OWNER_LABEL: Record<OwnerKind, string> = {
  self: 'You',
  minor: 'Minors',
  family: 'Family',
};

/** Totals per member group, for the dashboard headings. */
export function viewBreakdown(view: ViewKey): { kind: OwnerKind; count: number }[] {
  const rows = bookingsForView(view);
  return (['self', 'minor', 'family'] as OwnerKind[])
    .map((kind) => ({ kind, count: rows.filter((r) => r.ownerKind === kind).length }))
    .filter((b) => b.count > 0);
}

export const VIEW_TITLE: Record<ViewKey, string> = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  in_progress: 'In progress',
  free_followup: 'Free follow-up',
  completed: 'Completed',
  second_opinion: 'Family doctor second opinion',
  cancelled: 'Cancelled',
};

/**
 * The order care moves through, cancelled last as the off-ramp.
 *
 * Free follow-up sits between running and finished because that's where it
 * happens: the appointment is over, but the patient still has something they
 * can use, and burying that in Completed is how it goes unused.
 */
export const VIEW_ORDER: ViewKey[] = [
  'pending', 'upcoming', 'in_progress', 'free_followup', 'completed',
  'second_opinion', 'cancelled',
];

/** How many closed second opinions the head lists, matching the family doctor screen. */
const SECOND_OPINION_LIMIT = 30;

export function bookingsForView(view: ViewKey): UnifiedBooking[] {
  const out: UnifiedBooking[] = [];

  /*
   * Family doctor second opinions.
   *
   * The same rows the Family Doctor screen lists, surfaced here so a patient
   * looking through their bookings finds them where they look for everything
   * else. Read straight from `secondOpinionBookings` rather than copied, so
   * the two screens can't drift apart about what exists or when it finished.
   *
   * Returned on its own rather than falling through to the product loops
   * below: `planMatch` ends in an unguarded arm that treats any unrecognised
   * view as "pending", which put three unpaid care plans in this head.
   */
  if (view === 'second_opinion') {
    const rows = [...secondOpinionBookings]
      .sort((a, b) => b.completed_date.localeCompare(a.completed_date))
      .map((b) => {
        const ch = secondOpinionChannel({
          bookingId: b.booking_id,
          doctorName: familyDoctor.name,
          productName: prettify(b.type),
          role: 'Family Doctor',
          daysSinceCompletion: daysBetween(b.completed_date),
          seed: b.thread,
        });
        // Buying more chat or a call re-opens the thread, exactly as it does
        // on the Family Doctor screen.
        const stillOpen = ch.daysLeft > 0 || isExtended(`so-${b.booking_id}`);
        return { b, ch, stillOpen };
      });

    // Open ones first and in full; finished ones capped the same way the
    // Family Doctor screen caps them, so years of history don't bury them.
    const ordered = [
      ...rows.filter((r) => r.stillOpen),
      ...rows.filter((r) => !r.stillOpen).slice(0, SECOND_OPINION_LIMIT),
    ];

    ordered.forEach(({ b, ch, stillOpen }) => out.push({
      id: b.booking_id,
      recordsShared: hasRecordsAccess(b.booking_id),
      completedOn: b.completed_date,
      title: familyDoctor.name,
      subtitle: `Second opinion on ${prettify(b.type)} · ${b.provider_name}`,
      // Days left leads: the row truncates to one line, and how long is left
      // to ask for free is the part worth reading before the date it ended.
      meta: stillOpen
        ? `${ch.daysLeft} days left to ask · ended ${b.completed_date}`
        : `Completed ${b.completed_date} · window closed`,
      kindLabel: 'Second Opinion',
      icon: 'medical-outline',
      tint: colors.secondary,
      route: '/more/family-doctor',
      ownerKind: ownerOf(b.booking_id).kind,
      ownerName: ownerOf(b.booking_id).name,
      categoryKey: 'second_opinion',
      categoryLabel: 'Second Opinion',
    }));
    return out;
  }

  // Consultations
  // A consult is "in progress" for the length of its slot — a 10-minute
  // instant consult occupies that state for ten minutes, exactly as a 90-day
  // plan occupies it for ninety days.
  // A booking-detail's follow-up channel is keyed `so-<REF>`, and the ref the
  // list hands over is the id uppercased — so an add-on bought there maps
  // straight back to this row. Buying one pulls a finished consult back into
  // In progress: paid-for, unused care is the definition of in-progress.
  const extended = (id: string) => isExtended(`so-${id.toUpperCase()}`);
  // A finished consult with its free window still open is neither running nor
  // done with — it gets its own head until the window closes.
  const consultMatch = (st: string, id = '', on?: string) => (
    view === 'free_followup'
      ? st === 'completed' && !extended(id) && freeFollowUpOpen(on)
      : view === 'completed'
        ? (st === 'rejected' || (st === 'completed' && !freeFollowUpOpen(on))) && !extended(id)
        : view === 'cancelled' ? st === 'cancelled'
          : view === 'in_progress' ? st === 'in_progress' || (st === 'completed' && extended(id))
            : st === view
  );
  appointments
    .filter((a) => consultMatch(a.status, a.id, a.appointment_date))
    .forEach((a) => out.push({
      id: a.id,
      recordsShared: hasRecordsAccess(a.id),
      completedOn: a.status === 'completed' ? a.appointment_date : undefined,
      title: a.doctor_name,
      subtitle: a.specialization,
      meta: `${a.appointment_date} · ${a.start_time} · ${a.duration_min} min · ${a.appointment_type.replace('_', ' ')}`,
      kindLabel: 'Consultation',
      icon: 'videocam-outline',
      tint: colors.primary,
      route: `/doctor/${a.doctor_id}`,
      ownerKind: ownerOf(a.id).kind,
      ownerName: ownerOf(a.id).name,
      categoryKey: a.category,
      categoryLabel: labelFor(a.category),
      slotMinutes: a.duration_min,
      awaiting: a.status !== 'pending' ? undefined
        : RAISED_BY[a.id]?.unpaid ? 'payment' : 'provider',
      rejected: a.status === 'rejected',
      paidAmount: 500,
      raisedBy: RAISED_BY[a.id]?.by,
    }));

  // Recovery plans — "in_process" is the running state, no upcoming equivalent.
  const recoveryMatch = (st: string, on?: string) => (
    view === 'in_progress' ? st === 'in_process'
      : view === 'upcoming' ? st === 'confirmed'
        : view === 'free_followup' ? st === 'completed' && freeFollowUpOpen(on)
          : view === 'completed'
            ? st === 'rejected' || (st === 'completed' && !freeFollowUpOpen(on))
            : view === 'cancelled' ? st === 'cancelled'
              : st === view
  );
  recoveryPlanOrders
    .filter((o) => recoveryMatch(o.status, o.completed_on))
    .forEach((o) => out.push({
      id: o.id,
      recordsShared: hasRecordsAccess(o.id),
      completedOn: o.completed_on,
      title: o.plan_name,
      subtitle: 'Recovery plan',
      meta: `Started ${o.ordered_on} · ₹${o.amount.toLocaleString('en-IN')}`,
      kindLabel: 'Recovery Plan',
      icon: 'thermometer-outline',
      tint: colors.error,
      route: '/more/recovery-plans',
      ownerKind: ownerOf(o.id).kind,
      ownerName: ownerOf(o.id).name,
      categoryKey: o.category,
      categoryLabel: labelFor(o.category),
      awaiting: o.status === 'pending' ? 'provider' : undefined,
      rejected: o.status === 'rejected',
      paidAmount: o.amount,
    }));

  // Advanced care — "active" is the running state.
  // A plan awaiting payment or the team's acceptance hasn't started yet, so
  // it belongs under Upcoming rather than in a limbo of its own.
  const planMatch = (st: string, on?: string) => (
    view === 'in_progress' ? st === 'active'
      : view === 'free_followup' ? st === 'completed' && freeFollowUpOpen(on)
        : view === 'completed'
          ? st === 'rejected' || (st === 'completed' && !freeFollowUpOpen(on))
          : view === 'cancelled' ? st === 'cancelled'
            : view === 'upcoming' ? st === 'confirmed'
              : st === 'pending_payment' || st === 'pending_acceptance'
  );
  planBookings
    .filter((b) => planMatch(b.status, b.completed_on))
    .forEach((b) => out.push({
      id: b.id,
      recordsShared: hasRecordsAccess(b.id),
      completedOn: b.completed_on,
      title: b.plan_name,
      subtitle: b.team_name,
      meta: `Paid ₹${b.amount_paid.toLocaleString('en-IN')} of ₹${b.total_payable.toLocaleString('en-IN')}`,
      kindLabel: 'Advanced Care',
      icon: 'heart-circle-outline',
      tint: colors.secondary,
      route: '/more/health-plans',
      ownerKind: ownerOf(b.id).kind,
      ownerName: ownerOf(b.id).name,
      categoryKey: b.category,
      categoryLabel: labelFor(b.category),
      awaiting: b.status === 'pending_acceptance' ? 'provider'
        : b.status === 'pending_payment' ? 'payment' : undefined,
      rejected: b.status === 'rejected',
      paidAmount: b.amount_paid,
      raisedBy: RAISED_BY[b.id]?.by,
    }));

  return out;
}

export const viewCount = (view: ViewKey) => bookingsForView(view).length;

/**
 * Which categories actually have bookings in this status. Offering all eight
 * when six of them are empty makes the filter feel broken.
 */
export function categoriesInView(view: ViewKey): { key: string; label: string; count: number }[] {
  const rows = bookingsForView(view);
  const seen = new Map<string, { key: string; label: string; count: number }>();
  rows.forEach((r) => {
    const hit = seen.get(r.categoryKey);
    if (hit) hit.count += 1;
    else seen.set(r.categoryKey, { key: r.categoryKey, label: r.categoryLabel, count: 1 });
  });
  return [...seen.values()];
}
