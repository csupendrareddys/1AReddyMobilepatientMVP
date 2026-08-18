import { Ionicons } from '@expo/vector-icons';
import { isExtended } from './extensions';
import { hasRecordsAccess } from './recordsAccess';
import {
  appointments, planBookings, productCategories, recoveryPlanOrders,
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
export type ViewKey = 'pending' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type OwnerKind = 'self' | 'minor' | 'family';

export type UnifiedBooking = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  kindLabel: 'Consultation' | 'Recovery Plan' | 'Advanced Care';
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
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** The order care moves through, cancelled last as the off-ramp. */
export const VIEW_ORDER: ViewKey[] = [
  'pending', 'upcoming', 'in_progress', 'completed', 'cancelled',
];

export function bookingsForView(view: ViewKey): UnifiedBooking[] {
  const out: UnifiedBooking[] = [];

  // Consultations
  // A consult is "in progress" for the length of its slot — a 10-minute
  // instant consult occupies that state for ten minutes, exactly as a 90-day
  // plan occupies it for ninety days.
  // A booking-detail's follow-up channel is keyed `so-<REF>`, and the ref the
  // list hands over is the id uppercased — so an add-on bought there maps
  // straight back to this row. Buying one pulls a finished consult back into
  // In progress: paid-for, unused care is the definition of in-progress.
  const extended = (id: string) => isExtended(`so-${id.toUpperCase()}`);
  const consultMatch = (st: string, id = '') => (
    view === 'completed' ? (st === 'completed' || st === 'rejected') && !extended(id)
      : view === 'cancelled' ? st === 'cancelled'
        : view === 'in_progress' ? st === 'in_progress' || (st === 'completed' && extended(id))
          : st === view
  );
  appointments
    .filter((a) => consultMatch(a.status, a.id))
    .forEach((a) => out.push({
      id: a.id,
      recordsShared: hasRecordsAccess(a.id),
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
  const recoveryMatch = (st: string) => (
    view === 'in_progress' ? st === 'in_process'
      : view === 'upcoming' ? st === 'confirmed'
        : view === 'completed' ? st === 'completed' || st === 'rejected'
          : view === 'cancelled' ? st === 'cancelled'
            : st === view
  );
  recoveryPlanOrders
    .filter((o) => recoveryMatch(o.status))
    .forEach((o) => out.push({
      id: o.id,
      recordsShared: hasRecordsAccess(o.id),
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
  const planMatch = (st: string) => (
    view === 'in_progress' ? st === 'active'
      : view === 'completed' ? st === 'completed' || st === 'rejected'
        : view === 'cancelled' ? st === 'cancelled'
          : view === 'upcoming' ? st === 'confirmed'
            : st === 'pending_payment' || st === 'pending_acceptance'
  );
  planBookings
    .filter((b) => planMatch(b.status))
    .forEach((b) => out.push({
      id: b.id,
      recordsShared: hasRecordsAccess(b.id),
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
