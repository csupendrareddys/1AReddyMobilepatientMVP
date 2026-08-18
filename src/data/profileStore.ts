import { ProfileField, RecordEntry } from './mock';

/**
 * Profile edits made in-session.
 *
 * The mock data is a module constant, so anything a patient changes has to live
 * somewhere else or it dies with the screen. Keeping it here — rather than in
 * each screen's state — means Profile Settings and Health Records show the same
 * surgery list, and a record added while scoped to a minor is still there when
 * you come back to them.
 *
 * Everything is keyed by person id ('self' or a minor id) so one person's edits
 * can never leak into another's.
 */

export type ListKey = 'surgeries' | 'generalRecords' | 'providerPrescriptions' | 'otherRecords';

const values = new Map<string, Record<string, string>>();
const extras = new Map<string, ProfileField[]>();
const lists = new Map<string, RecordEntry[]>();

let seq = 0;
/** Ids only need to be unique within the session. */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq += 1)}`;

/* ── Field values ─────────────────────────────────────────────────── */

export const valuesOf = (personId: string): Record<string, string> => values.get(personId) ?? {};

export function setValues(personId: string, patch: Record<string, string>) {
  values.set(personId, { ...valuesOf(personId), ...patch });
}

/* ── Custom fields the patient added ──────────────────────────────── */

export const extraFields = (personId: string, groupKey: string): ProfileField[] =>
  extras.get(`${personId}:${groupKey}`) ?? [];

export function addField(personId: string, groupKey: string, field: ProfileField) {
  const k = `${personId}:${groupKey}`;
  extras.set(k, [...(extras.get(k) ?? []), field]);
}

export function removeField(personId: string, groupKey: string, fieldKey: string) {
  const k = `${personId}:${groupKey}`;
  extras.set(k, (extras.get(k) ?? []).filter((f) => f.key !== fieldKey));
}

/* ── Record lists (surgeries, health records, prescriptions) ──────── */

/**
 * The live list, seeded from the mock the first time it's asked for. Copying
 * the attachments array matters: without it, adding a file to a surgery would
 * mutate the shared mock and show up on every other patient too.
 */
export function listFor(personId: string, key: ListKey, base: RecordEntry[]): RecordEntry[] {
  const k = `${personId}:${key}`;
  const cur = lists.get(k);
  if (cur) return cur;
  const seeded = base.map((e) => ({ ...e, attachments: [...e.attachments] }));
  lists.set(k, seeded);
  return seeded;
}

/** Insert or update by id. New entries go on top — most recent first. */
export function saveEntry(personId: string, key: ListKey, base: RecordEntry[], entry: RecordEntry) {
  const cur = listFor(personId, key, base);
  const exists = cur.some((e) => e.id === entry.id);
  lists.set(
    `${personId}:${key}`,
    exists ? cur.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...cur],
  );
}

export function deleteEntry(personId: string, key: ListKey, base: RecordEntry[], id: string) {
  const cur = listFor(personId, key, base);
  lists.set(`${personId}:${key}`, cur.filter((e) => e.id !== id));
}
