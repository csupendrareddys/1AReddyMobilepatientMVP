/**
 * Filtering a list of dated records by when they happened.
 *
 * Prescriptions and documents pile up over years, and the two questions a
 * patient actually asks of them are different: "what did the doctor give me
 * recently?" and "where is that old report?". So the split is a period rail —
 * recent versus everything older than three months — with an exact date range
 * underneath for when they know roughly when something was issued.
 *
 * Dates throughout the sample data are ISO `YYYY-MM-DD`, which compares
 * correctly as a plain string; nothing here needs a date library.
 */

/** Today, as the sample data reckons it. */
export const TODAY = '2026-08-18';

/** The line between "recent" and "old". Three months, per the request. */
export const RECENT_MONTHS = 3;

export type DatePeriod = 'all' | 'recent' | 'older';

export const PERIODS: { key: DatePeriod; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'albums-outline' },
  { key: 'recent', label: 'Recent', icon: 'time-outline' },
  { key: 'older', label: 'Over 3 months', icon: 'archive-outline' },
];

/** `2026-08-18` shifted back by whole months, still as `YYYY-MM-DD`. */
export function monthsBefore(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

/** `2026-08-18` shifted back by whole days. */
export function daysBefore(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** The cutoff date: anything on or after this counts as recent. */
export const RECENT_FROM = monthsBefore(TODAY, RECENT_MONTHS);

export type DateRange = { from: string; to: string };

export const emptyRange = (): DateRange => ({ from: '', to: '' });
export const hasRange = (r: DateRange) => !!(r.from || r.to);

/** Ready-made spans, so the common case needs no typing. */
export const RANGE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Last 7 days', range: () => ({ from: daysBefore(TODAY, 7), to: TODAY }) },
  { label: 'Last 30 days', range: () => ({ from: daysBefore(TODAY, 30), to: TODAY }) },
  { label: 'Last 3 months', range: () => ({ from: monthsBefore(TODAY, 3), to: TODAY }) },
  { label: 'Last 6 months', range: () => ({ from: monthsBefore(TODAY, 6), to: TODAY }) },
  { label: 'Last 12 months', range: () => ({ from: monthsBefore(TODAY, 12), to: TODAY }) },
  { label: 'This year', range: () => ({ from: `${TODAY.slice(0, 4)}-01-01`, to: TODAY }) },
];

/** A date with no recognisable day — "Just now" on a fresh upload — is new. */
const isoOf = (date: string) => (/^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : TODAY);

export function inPeriod(date: string, period: DatePeriod): boolean {
  if (period === 'all') return true;
  const d = isoOf(date);
  return period === 'recent' ? d >= RECENT_FROM : d < RECENT_FROM;
}

export function inRange(date: string, r: DateRange): boolean {
  const d = isoOf(date);
  if (r.from && d < r.from) return false;
  if (r.to && d > r.to) return false;
  return true;
}

/** The period rail counts what the range leaves, so the numbers match the list. */
export function periodCounts<T>(
  items: T[], getDate: (t: T) => string, range: DateRange,
): Record<DatePeriod, number> {
  const within = items.filter((i) => inRange(getDate(i), range));
  return {
    all: within.length,
    recent: within.filter((i) => inPeriod(getDate(i), 'recent')).length,
    older: within.filter((i) => inPeriod(getDate(i), 'older')).length,
  };
}

/** Newest first, then the period and range applied. */
export function applyDateFilter<T>(
  items: T[], getDate: (t: T) => string, period: DatePeriod, range: DateRange,
): T[] {
  return items
    .filter((i) => inRange(getDate(i), range) && inPeriod(getDate(i), period))
    .slice()
    .sort((a, b) => isoOf(getDate(b)).localeCompare(isoOf(getDate(a))));
}

/** "1 Apr 2026", for showing a chosen range back to the patient. */
export function pretty(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const [y, m, d] = iso.slice(0, 10).split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

export function rangeLabel(r: DateRange): string {
  if (r.from && r.to) return `${pretty(r.from)} — ${pretty(r.to)}`;
  if (r.from) return `From ${pretty(r.from)}`;
  if (r.to) return `Up to ${pretty(r.to)}`;
  return 'Any date';
}
