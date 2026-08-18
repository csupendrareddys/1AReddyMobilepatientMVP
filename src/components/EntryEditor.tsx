import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import DropdownModal from './DropdownModal';
import AttachSheet from './AttachSheet';
import { RecordEntry } from '../data/mock';
import { newId } from '../data/profileStore';
import { colors, radius, typography } from '../theme/theme';

/**
 * Add or edit one health record, wherever health records are shown.
 *
 * Profile Settings lists them as cards and Health Records as a table, but the
 * thing being edited is identical — so the form is shared. Attachments always
 * go through AttachSheet, which is the app's one camera / photos / files picker.
 */

const prettyKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const OTHER = 'Other…';

export const blankEntry = (): RecordEntry => ({
  id: '', record_type: '', record_date: '', details: '', notes: '', attachments: [],
});

type Props = {
  /** The entry being edited; a blank one means "add". Null closes the sheet. */
  entry: RecordEntry | null;
  onClose: () => void;
  onSave: (entry: RecordEntry) => void;
  onDelete?: (id: string) => void;
  /** Suggested types; free text is always available as well. */
  typeOptions?: string[];
  /** Names the thing being edited, e.g. "surgery". */
  noun: string;
};

export default function EntryEditor({
  entry, onClose, onSave, onDelete, typeOptions = [], noun,
}: Props) {
  const [draft, setDraft] = useState<RecordEntry>(blankEntry());
  const [customType, setCustomType] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // Re-seed on open so cancelling really cancels, and copy the attachments so
  // removing one doesn't mutate the record behind the sheet.
  useEffect(() => {
    if (!entry) return;
    setDraft({ ...entry, attachments: [...entry.attachments] });
    setCustomType(
      !!entry.record_type && typeOptions.length > 0
      && !typeOptions.some((t) => t.toLowerCase() === prettyKey(entry.record_type).toLowerCase()),
    );
  }, [entry]);

  const set = (patch: Partial<RecordEntry>) => setDraft((d) => ({ ...d, ...patch }));

  const commit = () => {
    onSave({
      ...draft,
      id: draft.id || newId('rec'),
      record_type: (draft.record_type || 'record').trim(),
      record_date: draft.record_date.trim() || 'Not dated',
      notes: draft.notes?.trim() ? draft.notes.trim() : undefined,
    });
    onClose();
  };

  const typeValue = customType ? OTHER : prettyKey(draft.record_type);

  return (
    <>
      <AppModal
        visible={!!entry}
        onClose={onClose}
        title={draft.id ? `Edit ${noun}` : `Add ${noun}`}
      >
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {typeOptions.length ? (
            <>
              <Text style={[typography.label, styles.label]}>TYPE</Text>
              <DropdownModal
                value={typeValue}
                options={[...typeOptions, OTHER].map((o) => ({ label: o, value: o }))}
                onChange={(v) => {
                  if (v === OTHER) { setCustomType(true); set({ record_type: '' }); }
                  else { setCustomType(false); set({ record_type: v }); }
                }}
                title="Type"
              />
            </>
          ) : null}

          {customType || !typeOptions.length ? (
            <>
              <Text style={[typography.label, styles.label]}>
                {typeOptions.length ? 'DESCRIBE THE TYPE' : 'TYPE'}
              </Text>
              <TextInput
                value={draft.record_type}
                onChangeText={(v) => set({ record_type: v })}
                placeholder="e.g. Allergy test"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </>
          ) : null}

          <Text style={[typography.label, styles.label]}>DATE</Text>
          <TextInput
            value={draft.record_date}
            onChangeText={(v) => set({ record_date: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={[typography.label, styles.label]}>DETAILS</Text>
          <TextInput
            value={draft.details}
            onChangeText={(v) => set({ details: v })}
            placeholder="What was done, findings, values…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.inputMulti]}
          />

          <Text style={[typography.label, styles.label]}>NOTES (OPTIONAL)</Text>
          <TextInput
            value={draft.notes ?? ''}
            onChangeText={(v) => set({ notes: v })}
            placeholder="Anything your doctor should know"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.inputMulti]}
          />

          <Text style={[typography.label, styles.label]}>ATTACHMENTS</Text>
          {draft.attachments.map((a) => {
            const photo = /\.(jpg|jpeg|png|heic)$/i.test(a.filename);
            return (
              <View key={a.id} style={styles.attRow}>
                <Ionicons
                  name={photo ? 'image-outline' : 'document-text-outline'}
                  size={16}
                  color={photo ? colors.secondary : colors.warningDark}
                />
                <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{a.filename}</Text>
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() => set({ attachments: draft.attachments.filter((x) => x.id !== a.id) })}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachOpen(true)}>
            <Ionicons name="attach" size={15} color={colors.primary} />
            <Text style={styles.attachText}>Add attachment</Text>
            <Text style={styles.attachHint}>Camera · Photos · Files</Text>
          </TouchableOpacity>

          {draft.id && onDelete ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => { onDelete(draft.id); onClose(); }}
            >
              <Ionicons name="trash-outline" size={14} color={colors.error} />
              <Text style={styles.deleteText}>Delete this entry</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.actionBtn} onPress={onClose} />
          <PrimaryButton
            label="Save"
            disabled={!draft.record_type.trim() && !draft.details.trim()}
            style={styles.actionBtn}
            onPress={commit}
          />
        </View>
      </AppModal>

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        withNote={false}
        onPick={(file) => {
          set({ attachments: [...draft.attachments, { id: newId('att'), filename: file }] });
          setAttachOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 400 },
  label: { marginTop: 12, marginBottom: 6 },
  input: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  attRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  attachText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  attachHint: { flex: 1, fontSize: 10.5, color: colors.textMuted, textAlign: 'right' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14 },
  deleteText: { fontSize: 12.5, fontWeight: '700', color: colors.error },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1 },
});
