/**
 * Who has been given access to the patient's health record, per booking.
 *
 * Sharing is decided during the booking flow, but it can't END there: a
 * patient who said no while booking often changes their mind once the
 * consultation is real — the doctor asks for history, and hunting back
 * through settings to grant it is exactly the wrong moment. So access is a
 * per-booking fact that can be granted (or withdrawn) from anywhere the
 * booking is shown, whatever state it's in.
 */

const norm = (id: string) => id.trim().toLowerCase();

/**
 * Bookings whose flow ended with "No, skip" on the records step.
 *
 * Seeded across every head — pending, upcoming, in progress, completed and
 * cancelled — so each list demonstrates the grant option. The backend will
 * carry this on the booking row.
 */
const NOT_SHARED_AT_BOOKING = new Set([
  'a2',   // upcoming
  'a9',   // in progress
  'a3',   // completed
  'a4',   // cancelled
  'a15',  // pending
  'ro6',  // pending plan
  'ro2',  // completed plan
  'ro5',  // cancelled plan
  'pb4',  // active care plan
]);

/** Granted after booking, from a list row or the booking's own page. */
const granted = new Set<string>();
/** Withdrawn after booking — consent can go both ways. */
const revoked = new Set<string>();

export function hasRecordsAccess(bookingId: string): boolean {
  const id = norm(bookingId);
  if (revoked.has(id)) return false;
  if (granted.has(id)) return true;
  return !NOT_SHARED_AT_BOOKING.has(id);
}

/** True when the flow said no and nothing has changed since — the grant case. */
export const canOfferAccess = (bookingId: string) => !hasRecordsAccess(bookingId);

export function grantRecordsAccess(bookingId: string) {
  const id = norm(bookingId);
  revoked.delete(id);
  granted.add(id);
}

export function revokeRecordsAccess(bookingId: string) {
  const id = norm(bookingId);
  granted.delete(id);
  revoked.add(id);
}
