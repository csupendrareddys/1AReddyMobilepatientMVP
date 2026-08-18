import React, { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import AttachSheet from './AttachSheet';
import VisitVitalsSheet from './VisitVitalsSheet';
import { CustomVital, VisitVitals, summarise } from '../data/visitVitals';
import {
  ShareSectionKey, SHARE_SECTION_META, shareSections,
} from '../data/shareSections';
import { symptoms as SYMPTOM_POOL } from '../data/mock';
import { colors, radius, typography } from '../theme/theme';

/**
 * The web's "Symptoms & Medical Records" step, condensed for a phone.
 *
 * Sharing is on by default and granular: a master yes/no, then a switch per
 * section, then a switch per row. The default is deliberate — a doctor seeing
 * the history is the normal case — but every level stays switchable, and the
 * screen always states plainly what is about to be sent.
 */

export type SharePayload = {
  share: boolean;
  symptoms: string[];
  customSymptom: string;
  description: string;
  remarks: string;
  attachments: string[];
  /** Readings taken because of this visit — not the standing health record. */
  vitals: VisitVitals;
  customVitals: CustomVital[];
  sections: Record<SectionKey, boolean>;
  items: Record<string, boolean>;
};

/** The sections and their contents both live in one place — see shareSections. */
type SectionKey = ShareSectionKey;

/** Symptom groups the web shows as tabs. */
const SYMPTOM_GROUPS: Record<string, string[]> = {
  General: ['Fever', 'Fatigue', 'Headache', 'Body Ache', 'Weight Loss'],
  Respiratory: ['Cough', 'Breathlessness', 'Sore Throat', 'Chest Congestion'],
  Cardiac: ['Chest Pain', 'Palpitations', 'Swollen Ankles'],
  Digestive: ['Nausea', 'Abdominal Pain', 'Loose Motions', 'Acidity'],
  Skin: ['Skin Rash', 'Itching', 'Hair Fall'],
  'Bones & Joints': ['Joint Pain', 'Back Pain', 'Stiffness'],
  'Long-term': ['Diabetes Follow-up', 'BP Follow-up', 'Thyroid Follow-up'],
};

const prettyKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const emptyShare = (): SharePayload => ({
  // Sharing starts ON: the doctor seeing the history is the normal case, and
  // the patient can switch it off here or untick individual rows below.
  share: true,
  symptoms: [],
  customSymptom: '',
  description: '',
  remarks: '',
  attachments: [],
  vitals: {},
  customVitals: [],
  sections: {
    vitals: true, habits: true, surgeries: true, health_records: true, prescriptions: true,
  },
  items: {},
});

type Props = {
  value: SharePayload;
  onChange: (next: SharePayload) => void;
  /** Whose records to offer — follows the patient the booking is for. */
  scopeKind?: string;
  scopeId?: string | null;
  patientName: string;
};

export default function MedicalRecordsShare({
  value, onChange, scopeKind = 'self', scopeId = null, patientName,
}: Props) {
  const [group, setGroup] = useState(Object.keys(SYMPTOM_GROUPS)[0]);
  const [open, setOpen] = useState<Record<string, boolean>>({ vitals: true });
  const [attachOpen, setAttachOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const set = (patch: Partial<SharePayload>) => onChange({ ...value, ...patch });

  // Straight from Profile Settings, so what's on offer here is exactly what the
  // patient sees there — including anything they added themselves.
  const SECTIONS = shareSections(scopeKind, scopeId);
  const rowsFor = (key: SectionKey) => SECTIONS.find((s) => s.key === key)?.rows ?? [];

  // Rows default to shared once the patient has opted in, so the common case
  // is one tap; unticking is what takes effort, not the reverse.
  const isOn = (id: string) => value.items[id] !== false;

  const toggleItem = (id: string) => set({ items: { ...value.items, [id]: !isOn(id) } });

  const setAll = (key: SectionKey, on: boolean) => {
    const next = { ...value.items };
    rowsFor(key).forEach((r) => { next[r.id] = on; });
    set({ items: next });
  };

  const sharedCount = useMemo(() => {
    if (!value.share) return 0;
    return SECTIONS.reduce((n, s) => (
      value.sections[s.key] ? n + rowsFor(s.key).filter((r) => isOn(r.id)).length : n
    ), 0);
  }, [value]);

  const toggleSymptom = (s: string) => set({
    symptoms: value.symptoms.includes(s)
      ? value.symptoms.filter((x) => x !== s)
      : [...value.symptoms, s],
  });

  return (
    <View>
      {/* ── Symptoms ─────────────────────────────────────────────── */}
      <Text style={styles.label}>What brings you in?</Text>
      <Text style={[typography.bodyMuted, styles.hint]}>
        Pick anything that applies. This reaches the provider before the consultation.
      </Text>

      {value.symptoms.length ? (
        <View style={styles.selectedRow}>
          {value.symptoms.map((s) => (
            <TouchableOpacity key={s} style={styles.selChip} onPress={() => toggleSymptom(s)}>
              <Text style={styles.selChipText}>{s}</Text>
              <Ionicons name="close" size={12} color={colors.white} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {Object.keys(SYMPTOM_GROUPS).map((g) => (
          <TouchableOpacity key={g} onPress={() => setGroup(g)} style={[styles.tab, group === g && styles.tabActive]}>
            <Text style={[styles.tabText, group === g && styles.tabTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chipWrap}>
        {(SYMPTOM_GROUPS[group] ?? SYMPTOM_POOL).map((s) => {
          const on = value.symptoms.includes(s);
          return (
            <TouchableOpacity key={s} onPress={() => toggleSymptom(s)} style={[styles.chip, on && styles.chipOn]}>
              {on ? <Ionicons name="checkmark" size={12} color={colors.primary} /> : null}
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        value={value.customSymptom}
        onChangeText={(t) => set({ customSymptom: t })}
        placeholder="Something not listed? Type it here"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      {/* ── Reason, vitals and attachments ───────────────────────── */}
      <Text style={styles.label}>Reason for visit / description</Text>
      <TextInput
        value={value.description}
        onChangeText={(t) => set({ description: t })}
        placeholder="Describe what you're experiencing — when it started, how it's changed"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.textArea]}
        multiline
      />
      <TextInput
        value={value.remarks}
        onChangeText={(t) => set({ remarks: t })}
        placeholder="Anything else the provider should know (optional)"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.textAreaSm]}
        multiline
      />

      {/* Readings that prompted the visit belong with the reason — half the
          time the number *is* the reason. Same sheet as a live booking, so a
          patient meets one way of entering vitals, not two. */}
      <View style={styles.attachHead}>
        <Text style={styles.subLabel}>Vitals for this visit</Text>
        <TouchableOpacity style={styles.attachBtn} onPress={() => setVitalsOpen(true)}>
          <Ionicons name="pulse-outline" size={14} color={colors.primary} />
          <Text style={styles.attachBtnText}>
            {summarise(value.vitals, value.customVitals).length ? 'Update' : 'Add vitals'}
          </Text>
        </TouchableOpacity>
      </View>
      {summarise(value.vitals, value.customVitals).length ? (
        <View style={styles.selectedRow}>
          {summarise(value.vitals, value.customVitals).map((line) => (
            <View key={line} style={styles.vitalChip}>
              <Text style={styles.vitalChipText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[typography.caption, styles.hint]}>
          BP, sugar, pulse, temperature or anything else you&apos;ve measured. All optional.
        </Text>
      )}

      <View style={styles.attachHead}>
        <Text style={styles.subLabel}>Attachments</Text>
        <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachOpen(true)}>
          <Ionicons name="attach-outline" size={14} color={colors.primary} />
          <Text style={styles.attachBtnText}>Add attachment</Text>
        </TouchableOpacity>
      </View>
      {value.attachments.length ? (
        <View style={styles.selectedRow}>
          {value.attachments.map((f) => (
            <View key={f} style={styles.fileChip}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.fileChipText} numberOfLines={1}>{f}</Text>
              <TouchableOpacity onPress={() => set({ attachments: value.attachments.filter((x) => x !== f) })} hitSlop={6}>
                <Ionicons name="close-circle" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[typography.caption, styles.hint]}>
          Reports, scans or photos from your camera, gallery or files.
        </Text>
      )}

      <VisitVitalsSheet
        visible={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        vitals={value.vitals}
        custom={value.customVitals}
        onSave={(v, c) => {
          set({ vitals: v, customVitals: c });
          setVitalsOpen(false);
        }}
      />

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        withNote={false}
        onPick={(file) => {
          if (!value.attachments.includes(file)) {
            set({ attachments: [...value.attachments, file] });
          }
          setAttachOpen(false);
        }}
      />

      {/* ── The yes/no gate ──────────────────────────────────────── */}
      <Text style={styles.label}>Share medical records</Text>
      <Card style={[styles.gate, value.share && styles.gateOn]}>
        <View style={styles.gateRow}>
          <View style={[styles.gateIcon, value.share && styles.gateIconOn]}>
            <Ionicons
              name={value.share ? 'shield-checkmark' : 'shield-outline'}
              size={19}
              color={value.share ? colors.white : colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Share {patientName}&apos;s records</Text>
            <Text style={typography.bodyMuted}>
              On by default. Switch it off, or untick individual items below.
            </Text>
          </View>
          <Switch
            value={value.share}
            onValueChange={(v) => set({ share: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.yesNo}>
          {[{ v: true, label: 'Yes, share' }, { v: false, label: 'No, skip' }].map((o) => (
            <TouchableOpacity
              key={String(o.v)}
              onPress={() => set({ share: o.v })}
              style={[styles.yesNoBtn, value.share === o.v && styles.yesNoBtnOn]}
            >
              <Text style={[styles.yesNoText, value.share === o.v && styles.yesNoTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {value.share ? (
          <Text style={styles.sharedNote}>
            {sharedCount} item{sharedCount === 1 ? '' : 's'} will be shared for this booking only.
          </Text>
        ) : (
          <Text style={styles.skipNote}>
            Nothing from your health record will be sent. You can still share it later from the consultation.
          </Text>
        )}
      </Card>

      {/* ── Per-section, per-item control ────────────────────────── */}
      {value.share ? SECTIONS.map((s) => {
        const rows = rowsFor(s.key);
        const on = value.sections[s.key];
        const expanded = open[s.key];
        const allOn = rows.every((r) => isOn(r.id));
        return (
          <Card key={s.key} style={styles.section}>
            <View style={styles.sectionHead}>
              <TouchableOpacity
                style={styles.sectionTitleRow}
                onPress={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionIcon, { backgroundColor: `${s.tint}1A` }]}>
                  <Ionicons name={s.icon} size={16} color={s.tint} />
                </View>
                <Text style={[typography.h3, { flex: 1 }]}>{s.title}</Text>
                <View style={styles.countChip}><Text style={styles.countText}>{rows.length}</Text></View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <Switch
                value={on}
                onValueChange={() => set({ sections: { ...value.sections, [s.key]: !on } })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {on && expanded ? (
              <>
                <TouchableOpacity style={styles.allBtn} onPress={() => setAll(s.key, !allOn)}>
                  <Ionicons name={allOn ? 'eye-off-outline' : 'eye-outline'} size={13} color={colors.primary} />
                  <Text style={styles.allBtnText}>{allOn ? 'Hide all' : 'Share all'}</Text>
                </TouchableOpacity>
                {rows.length ? rows.map((r) => (
                  <TouchableOpacity key={r.id} style={styles.itemRow} onPress={() => toggleItem(r.id)} activeOpacity={0.7}>
                    <Ionicons
                      name={isOn(r.id) ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isOn(r.id) ? colors.primary : colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemLabel} numberOfLines={1}>{r.label}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>{r.sub}</Text>
                    </View>
                    {r.files ? (
                      <View style={styles.fileBadge}>
                        <Ionicons name="attach" size={11} color={colors.primary} />
                        <Text style={styles.fileBadgeText}>{r.files}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                )) : (
                  <Text style={[typography.bodyMuted, styles.hint]}>Nothing recorded yet.</Text>
                )}
              </>
            ) : null}
          </Card>
        );
      }) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginTop: 20, marginBottom: 6 },
  subLabel: { ...typography.label, marginBottom: 0 },
  hint: { marginBottom: 10 },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  selChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.primary,
  },
  selChipText: { fontSize: 12, fontWeight: '700', color: colors.white },

  tabRow: { gap: 6, paddingBottom: 10 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.primary },

  input: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: colors.textPrimary, marginBottom: 10,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  textAreaSm: { minHeight: 60, textAlignVertical: 'top' },

  attachHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primary,
  },
  attachBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  fileChipText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary, flexShrink: 1 },
  vitalChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: '#FDECEA' },
  vitalChipText: { fontSize: 11.5, fontWeight: '700', color: colors.error },

  gate: { gap: 12, borderWidth: 1, borderColor: colors.border },
  gateOn: { borderColor: colors.primary },
  gateRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  gateIcon: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  gateIconOn: { backgroundColor: colors.primary },
  yesNo: { flexDirection: 'row', gap: 8 },
  yesNoBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  yesNoBtnOn: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  yesNoText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  yesNoTextOn: { color: colors.primary },
  sharedNote: { fontSize: 12, fontWeight: '600', color: colors.primary },
  skipNote: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  section: { marginTop: 10, gap: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  countChip: {
    minWidth: 21, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  allBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 8 },
  allBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  itemLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  itemSub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  fileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: '#E8F1FC',
  },
  fileBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});
