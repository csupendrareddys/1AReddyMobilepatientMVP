/**
 * Vitals recorded for one booking.
 *
 * These are deliberately separate from the patient's health record. A reading
 * taken because of *this* appointment — the BP that prompted the call, the
 * fever on the morning of the consult — belongs to the booking. Writing it
 * into the standing record would overwrite a baseline with a one-off, and the
 * provider would lose the context that made it worth mentioning.
 *
 * The field list mirrors the web's "Add vitals for this consultation".
 */

export type VitalField = {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  /** Two boxes on one row, e.g. systolic / diastolic. */
  pairWith?: string;
};

export const VISIT_VITALS: VitalField[] = [
  { key: 'bp_systolic', label: 'Blood pressure', unit: 'mmHg', placeholder: '120', pairWith: 'bp_diastolic' },
  { key: 'bp_diastolic', label: 'Diastolic', unit: 'mmHg', placeholder: '80' },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', placeholder: '72' },
  { key: 'temperature', label: 'Temperature', unit: '°F', placeholder: '98.6' },
  { key: 'sugar_fasting', label: 'Blood sugar — fasting', unit: 'mg/dL', placeholder: '95' },
  { key: 'sugar_pp', label: 'Blood sugar — post meal', unit: 'mg/dL', placeholder: '140' },
  { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
  { key: 'respiratory_rate', label: 'Respiratory rate', unit: '/min', placeholder: '16' },
  { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '71' },
  { key: 'height', label: 'Height', unit: 'cm', placeholder: '174' },
];

export type VisitVitals = Record<string, string>;
/** Anything the listed fields don't cover — the "any other parameter" case. */
export type CustomVital = { name: string; value: string };

const label = (k: string) => VISIT_VITALS.find((f) => f.key === k)?.label ?? k;
const unit = (k: string) => VISIT_VITALS.find((f) => f.key === k)?.unit ?? '';

/** One readable line per reading, for the summary and the thread message. */
export function summarise(v: VisitVitals, custom: CustomVital[] = []): string[] {
  const out: string[] = [];

  // Blood pressure only means anything as a pair.
  if (v.bp_systolic || v.bp_diastolic) {
    out.push(`Blood pressure: ${v.bp_systolic || '—'}/${v.bp_diastolic || '—'} mmHg`);
  }
  VISIT_VITALS
    .filter((f) => f.key !== 'bp_systolic' && f.key !== 'bp_diastolic')
    .forEach((f) => {
      if (v[f.key]) out.push(`${label(f.key)}: ${v[f.key]} ${unit(f.key)}`.trim());
    });

  custom
    .filter((c) => c.name.trim() && c.value.trim())
    .forEach((c) => out.push(`${c.name.trim()}: ${c.value.trim()}`));

  return out;
}

export const countVitals = (v: VisitVitals, custom: CustomVital[] = []) =>
  summarise(v, custom).length;
