import React, { useReducer, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import AppModal from '../../src/components/AppModal';
import EntryEditor, { blankEntry } from '../../src/components/EntryEditor';
import { usePatientScope } from '../../src/scope/PatientScope';
import PersonSelector from '../../src/components/PersonSelector';
import { peopleFor, SELF_ID } from '../../src/data/people';
import { recordFor } from '../../src/data/minorData';
import { minors, RecordEntry } from '../../src/data/mock';
import {
  deleteEntry, listFor, ListKey, saveEntry,
} from '../../src/data/profileStore';
import { colors, radius, typography } from '../../src/theme/theme';

const prettyKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The web page's heads, plus one.
 *
 * Prescriptions split in two because they answer different questions: what our
 * own doctors put you on ("Previous prescriptions in this platform", which we
 * can link to the full prescription) versus what you were given elsewhere and
 * uploaded ("Other prescriptions"). Lumping them together made it impossible
 * to tell which ones we're accountable for.
 */
const SECTIONS = [
  { key: 'vitals', title: 'Vitals', icon: 'pulse-outline' as const, tint: colors.error },
  { key: 'habits', title: 'Habits & Lifestyle', icon: 'leaf-outline' as const, tint: colors.success },
  { key: 'surgeries', title: 'Surgeries', icon: 'bandage-outline' as const, tint: colors.warning },
  { key: 'records', title: 'Health Records', icon: 'folder-open-outline' as const, tint: colors.primary },
  { key: 'platform_rx', title: 'Previous prescriptions in this platform', icon: 'medkit-outline' as const, tint: colors.primary },
  { key: 'prescriptions', title: 'Other prescriptions', icon: 'document-text-outline' as const, tint: colors.secondary },
  { key: 'others', title: 'Others', icon: 'cube-outline' as const, tint: colors.textMuted },
];

/** Suggested entry types, matching the ones offered in Profile Settings. */
const TYPE_OPTIONS: Record<string, string[]> = {
  surgeries: ['Appendectomy', 'Caesarean Section', 'Cataract Surgery', 'Dental Surgery', 'Fracture Fixation', 'Gallbladder Removal', 'Hernia Repair', 'Tonsillectomy'],
  records: ['Lab Report', 'Diagnosis', 'Vaccination', 'Imaging / Scan', 'Consultation', 'Discharge Summary', 'Allergy', 'Growth Monitoring'],
  prescriptions: ['Prescription', 'Repeat Prescription', 'Hospital Discharge Medicines', 'Over-the-counter Advice'],
  others: ['Insurance Document', 'Birth Certificate', 'Fitness Certificate', 'ID Proof', 'School Health Card'],
};

/** Which store list each editable section writes to. */
const LIST_KEYS: Record<string, ListKey> = {
  surgeries: 'surgeries',
  records: 'generalRecords',
  prescriptions: 'providerPrescriptions',
  others: 'otherRecords',
};

const NOUNS: Record<string, string> = {
  surgeries: 'surgery', records: 'health record',
  prescriptions: 'prescription', others: 'document',
};

export default function HealthRecordsScreen() {
  const router = useRouter();
  // Read through the scope so a minor's records can never show the guardian's.
  const { scope, enter, exit } = usePatientScope();
  const people = peopleFor({ includeMinors: true });
  const personId = scope.kind === 'minor' && scope.id ? scope.id : SELF_ID;
  const pickPerson = (id: string) => {
    if (id === SELF_ID) return exit();
    const m = minors.find((x) => x.id === id);
    if (m) enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
  };
  const record = recordFor(scope.kind, scope.id);
  const minor = minors.find((m) => m.id === scope.id);

  const [open, setOpen] = useState<Record<string, boolean>>({ vitals: true });
  const [detail, setDetail] = useState<RecordEntry | null>(null);
  // Which section the editor is writing into, and the entry being edited.
  const [editing, setEditing] = useState<{ section: string; entry: RecordEntry } | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  /** The mock list a section is seeded from. */
  const baseOf = (key: string): RecordEntry[] =>
    key === 'surgeries' ? record.surgeries
      : key === 'records' ? record.generalRecords
        : key === 'prescriptions' ? record.providerPrescriptions
          : key === 'others' ? record.otherRecords : [];

  // Prescriptions written on this platform aren't editable records — they're
  // the doctor's output, so they render read-only and link to the full one.
  const platformRx: RecordEntry[] = record.prescriptions.map((p) => ({
    id: p.id,
    record_type: p.doctor_name,
    record_date: p.date,
    details: p.diagnosis,
    notes: p.advice,
    attachments: p.medicines.map((m, i) => ({ id: `${p.id}-m${i}`, filename: m.name })),
  }));

  const rowsFor = (key: string): RecordEntry[] =>
    key === 'platform_rx' ? platformRx
      : LIST_KEYS[key] ? listFor(personId, LIST_KEYS[key], baseOf(key)) : [];

  const countFor = (key: string) =>
    key === 'vitals' || key === 'habits' ? undefined : rowsFor(key).length;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Health Records" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Your complete health profile — vitals, lifestyle, surgeries, records and
        prescriptions. Tap any row to see full details.
      </Text>

      <PersonSelector label="Viewing" people={people} value={personId} onChange={pickPerson} />

      {SECTIONS.map((s) => {
        const expanded = open[s.key];
        const count = countFor(s.key);
        const kv = s.key === 'vitals' ? record.vitals : s.key === 'habits' ? record.habits : null;
        const rows = kv ? [] : rowsFor(s.key);
        // Vitals and habits are edited as profile fields; prescriptions written
        // here belong to the doctor. Everything else the patient owns.
        const editable = !!LIST_KEYS[s.key];

        return (
          <View key={s.key} style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle(s.key)} activeOpacity={0.7}>
              <View style={[styles.sectionIcon, { backgroundColor: `${s.tint}1A` }]}>
                <Ionicons name={s.icon} size={17} color={s.tint} />
              </View>
              <Text style={[typography.h3, styles.sectionTitle]}>{s.title}</Text>
              {count !== undefined ? (
                <View style={styles.countChip}><Text style={styles.countText}>{count}</Text></View>
              ) : null}
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={17}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {expanded ? (
              <View style={styles.sectionBody}>
                {/* Vitals & Habits render as a Field / Value table. They're
                    edited as profile fields, so the button goes there. */}
                {kv ? (
                  <>
                    {Object.entries(kv).map(([k, v]) => (
                      <View key={k} style={styles.kvRow}>
                        <Text style={styles.kvKey}>{prettyKey(k)}</Text>
                        <Text style={styles.kvValue}>{v}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addRow}
                      onPress={() => router.push('/more/profile-settings')}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.primary} />
                      <Text style={styles.addRowText}>Edit or add a parameter</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {editable ? (
                      <TouchableOpacity
                        style={styles.addRow}
                        onPress={() => setEditing({ section: s.key, entry: blankEntry() })}
                      >
                        <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
                        <Text style={styles.addRowText}>Add {NOUNS[s.key]}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {rows.length ? (
                      <>
                        {/* Column header, matching the web table. */}
                        <View style={styles.tableHead}>
                          <Text style={[styles.th, styles.colType]}>
                            {s.key === 'platform_rx' ? 'Doctor' : 'Type'}
                          </Text>
                          <Text style={[styles.th, styles.colDate]}>Date</Text>
                          <Text style={[styles.th, styles.colFiles]}>
                            {s.key === 'platform_rx' ? 'Meds' : 'Files'}
                          </Text>
                          {editable ? <View style={styles.colEdit} /> : null}
                        </View>
                        {rows.map((r) => (
                          <View key={r.id} style={styles.tr}>
                            <TouchableOpacity
                              style={styles.trMain}
                              activeOpacity={0.7}
                              onPress={() => (s.key === 'platform_rx'
                                ? router.push('/more/prescriptions')
                                : setDetail(r))}
                            >
                              <Text style={[styles.td, styles.colType, styles.tdStrong]} numberOfLines={2}>
                                {prettyKey(r.record_type)}
                              </Text>
                              <Text style={[styles.td, styles.colDate]}>{r.record_date}</Text>
                              <View style={styles.colFiles}>
                                {r.attachments.length ? (
                                  <View style={styles.fileChip}>
                                    <Ionicons
                                      name={s.key === 'platform_rx' ? 'medkit-outline' : 'attach'}
                                      size={11}
                                      color={colors.primary}
                                    />
                                    <Text style={styles.fileChipText}>{r.attachments.length}</Text>
                                  </View>
                                ) : (
                                  <Text style={styles.tdMuted}>—</Text>
                                )}
                              </View>
                              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                            </TouchableOpacity>
                            {editable ? (
                              <TouchableOpacity
                                style={styles.colEdit}
                                hitSlop={6}
                                onPress={() => setEditing({ section: s.key, entry: r })}
                              >
                                <Ionicons name="create-outline" size={16} color={colors.primary} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))}
                      </>
                    ) : (
                      <Text style={[typography.bodyMuted, styles.empty]}>Nothing recorded.</Text>
                    )}
                  </>
                )}
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Add / edit, with camera · photos · files attachments */}
      <EntryEditor
        entry={editing?.entry ?? null}
        onClose={() => setEditing(null)}
        noun={editing ? NOUNS[editing.section] : 'record'}
        typeOptions={editing ? TYPE_OPTIONS[editing.section] ?? [] : []}
        onSave={(e) => {
          if (!editing) return;
          saveEntry(personId, LIST_KEYS[editing.section], baseOf(editing.section), e);
          bump();
        }}
        onDelete={(id) => {
          if (!editing) return;
          deleteEntry(personId, LIST_KEYS[editing.section], baseOf(editing.section), id);
          bump();
        }}
      />

      {/* Full record detail */}
      <AppModal
        visible={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? prettyKey(detail.record_type) : ''}
      >
        {detail ? (
          <ScrollView style={styles.detailScroll}>
            <DetailRow label="Type" value={prettyKey(detail.record_type)} />
            <DetailRow label="Date" value={detail.record_date} />

            <Text style={[typography.label, styles.detailLabel]}>DETAILS</Text>
            {detail.details.split('·').map((part, i) => (
              <View key={i} style={styles.detailBullet}>
                <View style={styles.bulletDot} />
                <Text style={typography.body}>{part.trim()}</Text>
              </View>
            ))}

            {detail.notes ? (
              <>
                <Text style={[typography.label, styles.detailLabel]}>NOTES</Text>
                <Text style={typography.body}>{detail.notes}</Text>
              </>
            ) : null}

            <Text style={[typography.label, styles.detailLabel]}>ATTACHMENTS</Text>
            {detail.attachments.length ? (
              detail.attachments.map((a) => (
                <View key={a.id} style={styles.attRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.warningDark} />
                  <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{a.filename}</Text>
                  <Text style={styles.attOpen}>Open</Text>
                </View>
              ))
            ) : (
              <Text style={typography.bodyMuted}>No attachments.</Text>
            )}
          </ScrollView>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.body, styles.detailValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 14 },
  viewingRow: { marginBottom: 18 },
  section: {
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginBottom: 12, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: colors.background,
  },
  sectionIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1 },
  countChip: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  sectionBody: { paddingHorizontal: 14, paddingVertical: 10 },
  kvRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 14,
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  kvKey: { flex: 1, fontSize: 13, color: colors.textSecondary },
  kvValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  tableHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  th: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  trMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11 },
  colEdit: { width: 28, alignItems: 'flex-end' },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9,
  },
  addRowText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  td: { fontSize: 12.5, color: colors.textSecondary },
  tdStrong: { fontWeight: '600', color: colors.textPrimary },
  tdMuted: { fontSize: 12.5, color: colors.textMuted },
  colType: { flex: 2.4 },
  colDate: { flex: 1.5 },
  colFiles: { width: 44 },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start',
    backgroundColor: '#E8F1FC', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill,
  },
  fileChipText: { fontSize: 10.5, fontWeight: '700', color: colors.primary },
  empty: { paddingVertical: 6 },
  detailScroll: { maxHeight: 420 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 5 },
  detailValue: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  detailLabel: { marginTop: 14, marginBottom: 6 },
  detailBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
  attRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  attOpen: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
