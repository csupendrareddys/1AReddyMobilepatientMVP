import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import DropdownModal from './DropdownModal';
import { ProfileField } from '../data/mock';
import { newId } from '../data/profileStore';
import { colors, radius, typography } from '../theme/theme';

/**
 * Adds a field a section doesn't have.
 *
 * Our field list is a guess at what people track; theirs is what they actually
 * track. Someone monitoring peak flow, HbA1c or a supplement shouldn't have to
 * squash it into "Notes" — so any section can grow a column.
 */

const KINDS: { label: string; value: NonNullable<ProfileField['type']> }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Long text', value: 'multiline' },
];

export default function AddFieldSheet({
  visible, onClose, onAdd, sectionTitle,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (field: ProfileField) => void;
  sectionTitle: string;
}) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [kind, setKind] = useState<NonNullable<ProfileField['type']>>('text');

  useEffect(() => {
    if (visible) { setLabel(''); setValue(''); setKind('text'); }
  }, [visible]);

  return (
    <AppModal visible={visible} onClose={onClose} title={`Add to ${sectionTitle}`}>
      <Text style={typography.bodyMuted}>
        Track something this section doesn&apos;t list yet.
      </Text>

      <Text style={[typography.label, styles.label]}>FIELD NAME</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. HbA1c, Peak flow, Supplement"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <Text style={[typography.label, styles.label]}>KIND</Text>
      <DropdownModal
        value={kind}
        options={KINDS}
        onChange={(v) => setKind(v as NonNullable<ProfileField['type']>)}
        title="Kind"
      />

      <Text style={[typography.label, styles.label]}>VALUE</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Leave blank to fill in later"
        placeholderTextColor={colors.textMuted}
        multiline={kind === 'multiline'}
        keyboardType={kind === 'number' ? 'numeric' : 'default'}
        style={[styles.input, kind === 'multiline' && styles.inputMulti]}
      />

      <View style={styles.actions}>
        <PrimaryButton label="Cancel" variant="outline" style={styles.btn} onPress={onClose} />
        <PrimaryButton
          label="Add field"
          disabled={!label.trim()}
          style={styles.btn}
          onPress={() => {
            onAdd({
              key: newId('custom'),
              label: label.trim(),
              value: value.trim(),
              type: kind,
            });
            onClose();
          }}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 14, marginBottom: 6 },
  input: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { flex: 1 },
});
