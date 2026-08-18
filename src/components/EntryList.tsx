import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import EntryEditor, { blankEntry } from './EntryEditor';
import { RecordEntry } from '../data/mock';
import { colors, radius, typography } from '../theme/theme';

/**
 * A section of health records the patient can add to and edit.
 *
 * Surgeries, health records and prescriptions are the same thing structurally —
 * a typed, dated entry with notes and files — so they share one list and one
 * editor (EntryEditor, which also carries the camera / photos / files picker).
 */

const prettyKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Props = {
  title: string;
  /** One line under the title — what belongs in this list, when it isn't obvious. */
  subtitle?: string;
  entries: RecordEntry[];
  emptyText: string;
  typeOptions?: string[];
  /** Lists the patient doesn't own — provider output — render without editing. */
  readOnly?: boolean;
  onSave?: (entry: RecordEntry) => void;
  onDelete?: (id: string) => void;
  onPressRow?: (entry: RecordEntry) => void;
  addLabel?: string;
  filesLabel?: string;
  /** Names one entry in the editor's title, e.g. "surgery". */
  noun?: string;
  style?: StyleProp<ViewStyle>;
};

export default function EntryList({
  title, subtitle, entries, emptyText, typeOptions = [], readOnly, onSave, onDelete,
  onPressRow, addLabel = 'Add new', filesLabel = 'files', noun, style,
}: Props) {
  const [draft, setDraft] = useState<RecordEntry | null>(null);

  return (
    <>
      <Card style={[styles.card, style]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {readOnly ? null : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setDraft(blankEntry())}>
              <Ionicons name="add" size={14} color={colors.white} />
              <Text style={styles.addText}>{addLabel}</Text>
            </TouchableOpacity>
          )}
        </View>

        {entries.length ? entries.map((e) => (
          <TouchableOpacity
            key={e.id}
            style={styles.row}
            activeOpacity={onPressRow ? 0.7 : 1}
            onPress={() => onPressRow?.(e)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{prettyKey(e.record_type)}</Text>
              <Text style={typography.caption}>{e.record_date}</Text>
              {e.details ? (
                <Text style={styles.rowDetail} numberOfLines={2}>{e.details}</Text>
              ) : null}
              {e.notes ? <Text style={styles.rowNote} numberOfLines={2}>{e.notes}</Text> : null}
            </View>
            {e.attachments.length ? (
              <View style={styles.fileChip}>
                <Ionicons name="attach" size={11} color={colors.primary} />
                <Text style={styles.fileChipText}>{e.attachments.length} {filesLabel}</Text>
              </View>
            ) : null}
            {readOnly ? null : (
              <TouchableOpacity onPress={() => setDraft(e)} hitSlop={8} style={styles.pencil}>
                <Ionicons name="create-outline" size={17} color={colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )) : (
          <Text style={[typography.bodyMuted, styles.empty]}>{emptyText}</Text>
        )}
      </Card>

      <EntryEditor
        entry={draft}
        onClose={() => setDraft(null)}
        onSave={(e) => onSave?.(e)}
        onDelete={onDelete}
        typeOptions={typeOptions}
        noun={noun ?? title.replace(/s$/, '').toLowerCase()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.sm,
  },
  addText: { fontSize: 11.5, fontWeight: '700', color: colors.white },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  rowNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  pencil: { paddingTop: 2 },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
  },
  fileChipText: { fontSize: 10.5, fontWeight: '700', color: colors.primary },
  empty: { paddingVertical: 6 },
});
