import { Ionicons } from '@expo/vector-icons';
import { recordFor } from './minorData';
import { extraFields, listFor, valuesOf } from './profileStore';
import { colors } from '../theme/theme';

/**
 * What "share my medical records" actually offers, in one place.
 *
 * The booking flow asks the question and My Bookings answers it later, and the
 * two must show the same thing — a patient who ticked four surgeries should see
 * four surgeries on the booking, not a different list assembled by different
 * code. So both read this.
 *
 * Everything comes from Profile Settings: the same section headings, the same
 * rows, including anything the patient added there. A field they typed in this
 * morning is shareable this afternoon without a second data path.
 */

export type ShareSectionKey =
  | 'vitals' | 'habits' | 'surgeries' | 'health_records' | 'prescriptions';

export type ShareRow = {
  /** Stable across renders — the share payload keys off it. */
  id: string;
  label: string;
  sub: string;
  files: number;
};

export type ShareSection = {
  key: ShareSectionKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  rows: ShareRow[];
};

export const SHARE_SECTION_META: {
  key: ShareSectionKey; title: string; icon: keyof typeof Ionicons.glyphMap; tint: string;
}[] = [
  { key: 'vitals', title: 'Vitals', icon: 'pulse-outline', tint: colors.error },
  { key: 'habits', title: 'Habits & Lifestyle', icon: 'leaf-outline', tint: colors.success },
  { key: 'surgeries', title: 'Surgeries', icon: 'bandage-outline', tint: colors.warning },
  { key: 'health_records', title: 'Health Records', icon: 'folder-open-outline', tint: colors.primary },
  { key: 'prescriptions', title: 'Previous Prescriptions', icon: 'medkit-outline', tint: colors.secondary },
];

const prettyKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** 'self' for the logged-in patient, otherwise the minor's id. */
const personIdOf = (scopeKind: string, scopeId: string | null) =>
  (scopeKind === 'minor' && scopeId ? scopeId : 'self');

/**
 * The profile-settings rows for one field group — the group's own fields, any
 * the patient added, with edited values applied. Blank fields are dropped:
 * "Alternative Email — Not set" is noise in a list a doctor is about to read.
 */
function fieldRows(
  scopeKind: string, scopeId: string | null, groupKey: ShareSectionKey,
): ShareRow[] {
  const record = recordFor(scopeKind, scopeId);
  const personId = personIdOf(scopeKind, scopeId);
  const values = valuesOf(personId);
  const groups = record.profileGroups[groupKey] ?? [];

  return groups.flatMap((g) => [...g.fields, ...extraFields(personId, g.key)]
    .map((f) => ({
      id: `${groupKey}:${f.key}`,
      label: f.label,
      sub: values[f.key] ?? f.value,
      files: 0,
    }))
    .filter((r) => r.sub.trim() !== '' && r.sub !== '—'));
}

/** Every section the patient can share, with its current contents. */
export function shareSections(scopeKind: string, scopeId: string | null): ShareSection[] {
  const record = recordFor(scopeKind, scopeId);
  const personId = personIdOf(scopeKind, scopeId);

  return SHARE_SECTION_META.map((meta) => {
    let rows: ShareRow[];

    if (meta.key === 'vitals' || meta.key === 'habits') {
      rows = fieldRows(scopeKind, scopeId, meta.key);
    } else if (meta.key === 'surgeries') {
      rows = listFor(personId, 'surgeries', record.surgeries).map((r) => ({
        id: `surgeries:${r.id}`,
        label: prettyKey(r.record_type),
        sub: r.record_date,
        files: r.attachments.length,
      }));
    } else if (meta.key === 'health_records') {
      rows = listFor(personId, 'generalRecords', record.generalRecords).map((r) => ({
        id: `health_records:${r.id}`,
        label: prettyKey(r.record_type),
        sub: r.record_date,
        files: r.attachments.length,
      }));
    } else {
      // Both kinds of prescription, labelled by where they came from — a doctor
      // reading this needs to know which ones we issued and which the patient
      // brought in from elsewhere.
      rows = [
        ...record.prescriptions.map((p) => ({
          id: `prescriptions:${p.id}`,
          label: p.doctor_name,
          sub: `${p.date} · ${p.diagnosis}`,
          files: p.medicines.length,
        })),
        ...listFor(personId, 'providerPrescriptions', record.providerPrescriptions).map((r) => ({
          id: `prescriptions:${r.id}`,
          label: prettyKey(r.record_type),
          sub: `${r.record_date} · from outside this platform`,
          files: r.attachments.length,
        })),
      ];
    }

    return { ...meta, rows };
  });
}

/** Total rows on offer — what "share everything" would amount to. */
export const shareableCount = (scopeKind: string, scopeId: string | null) =>
  shareSections(scopeKind, scopeId).reduce((n, s) => n + s.rows.length, 0);
