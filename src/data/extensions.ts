import { AddOnKey } from './addons';

/**
 * Add-ons bought against a booking, and what buying one does to it.
 *
 * An extension is care the patient has paid for and not yet used, which is the
 * definition of in-progress. So buying extra messages on a booking that had
 * finished pulls it back into In progress — the alternative is selling someone
 * twenty messages and filing the booking under Completed, where they will not
 * think to look for it.
 *
 * The patient is told this before they pay, not discovered afterwards.
 */

/**
 * Where an extended booking resurfaces.
 *
 * A second opinion lives on the Family Doctor screen, not in My Bookings, so
 * buying messages against one has to bring it back under *that* screen's In
 * progress head. Sending the patient to the wrong list is the same as losing
 * what they paid for.
 */
export type ExtensionScope = 'booking' | 'second_opinion';

export type Extension = {
  bookingId: string;
  scope: ExtensionScope;
  key: AddOnKey;
  unit: string;
  boughtOn: string;
};

/**
 * Every completed booking's follow-up thread is `so-<ref>`, but only the
 * Family Doctor screen's second opinions use the `sob` booking ids — so the
 * prefix alone can't be the test, or a consult topped up from My Bookings
 * would be sent to the wrong screen to find itself.
 */
export const scopeOf = (bookingId: string): ExtensionScope =>
  (bookingId.startsWith('so-sob') ? 'second_opinion' : 'booking');

const bought = new Map<string, Extension[]>();

/** Emergency calls are answered now; they don't extend a booking's life. */
const EXTENDS: Record<AddOnKey, boolean> = {
  chat: true,
  video: true,
  audio: true,
  // Buying days is the most literal extension there is.
  days: true,
  emergency: false,
};

export const extendsBooking = (key: AddOnKey) => EXTENDS[key] ?? false;

/** What buying this add-on will do — shown before payment, in plain words. */
export function purchaseNote(key: AddOnKey, unit: string, bookingId = ''): string {
  if (!extendsBooking(key)) {
    return 'An on-call doctor will be requested straight away. This does not change '
      + 'where the booking sits in your list.';
  }
  if (key === 'days') {
    return `${unit} will be added to this plan's term, and the booking stays under `
      + '"In progress" while it runs. Your care team and allowances carry on unchanged.';
  }
  return scopeOf(bookingId) === 'second_opinion'
    ? `${unit} will be added to this second opinion, and it moves back to `
      + '"In progress" under Family Doctor — that is where to find it afterwards.'
    : `${unit} will be added to this booking, and the booking moves to `
      + '"In progress" so you can find it. Look under My Bookings → In progress.';
}

/** Where the patient should look after paying — used on the confirmation. */
export const destinationOf = (bookingId: string) =>
  (scopeOf(bookingId) === 'second_opinion'
    ? { label: 'Family Doctor → In progress', route: '/more/family-doctor' }
    : { label: 'My Bookings → In progress', route: '/(tabs)/appointments?view=in_progress' });

export function recordExtension(bookingId: string, key: AddOnKey, unit: string) {
  if (!bookingId) return;
  const rows = bought.get(bookingId) ?? [];
  bought.set(bookingId, [...rows, {
    bookingId, scope: scopeOf(bookingId), key, unit, boughtOn: 'just now',
  }]);
}

export const extensionsFor = (bookingId: string): Extension[] => bought.get(bookingId) ?? [];

/**
 * Whether a booking has been pulled back into In progress by an extension.
 *
 * Only the allowance add-ons do it — an emergency call is a one-off event, not
 * an extension of the term.
 */
export const isExtended = (bookingId: string): boolean =>
  extensionsFor(bookingId).some((e) => extendsBooking(e.key));

/** Every booking currently held open by an extension. */
export const extendedBookingIds = (): string[] =>
  [...bought.keys()].filter((id) => isExtended(id));
