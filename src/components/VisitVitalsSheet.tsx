import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import {
  CustomVital, VisitVitals, VISIT_VITALS, summarise,
} from '../data/visitVitals';
import { colors, radius, typography } from '../theme/theme';

/**
 * Readings taken for one booking — the BP that prompted the call, the fever on
 * the morning of the consult.
 *
 * Everything is optional. A patient who only knows their temperature should be
 * able to send that and nothing else; demanding a full set would mean most
 * people send none.
 */
export default function VisitVitalsSheet({
  visible, onClose, vitals, custom, onSave,
}: {
  visible: boolean;
  onClose: () => void;
  vitals: VisitVitals;
  custom: CustomVital[];
  onSave: (v: VisitVitals, c: CustomVital[]) => void;
}) {
  const [draft, setDraft] = useState<VisitVitals>(vitals);
  const [extra, setExtra] = useState<CustomVital[]>(custom);

  // Re-seed whenever the sheet opens, so cancelling really cancels.
  React.useEffect(() => {
    if (visible) {
      setDraft(vitals);
      setExtra(custom.length ? custom : [{ name: '', value: '' }]);
    }
  }, [visible]);

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const filled = summarise(draft, extra).length;

  const rows = VISIT_VITALS.filter((f) => f.key !== 'bp_diastolic');

  return (
    <AppModal visible={visible} onClose={onClose} title="Vitals for this visit">
      <Text style={typography.bodyMuted}>
        Anything you&apos;ve measured recently. All optional — send what you have.
      </Text>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {rows.map((f) => (
          <View key={f.key} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={2}>
              {f.pairWith ? 'Blood pressure' : f.label}
            </Text>
            <View style={styles.inputs}>
              <TextInput
                value={draft[f.key] ?? ''}
                onChangeText={(t) => set(f.key, t)}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
              />
              {f.pairWith ? (
                <>
                  <Text style={styles.slash}>/</Text>
                  <TextInput
                    value={draft[f.pairWith] ?? ''}
                    onChangeText={(t) => set(f.pairWith!, t)}
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </>
              ) : null}
              <Text style={styles.unit}>{f.unit}</Text>
            </View>
          </View>
        ))}

        {/* Anything the standard list doesn't cover. */}
        <Text style={[typography.label, styles.otherLabel]}>ANY OTHER PARAMETER</Text>
        {extra.map((c, i) => (
          <View key={i} style={styles.customRow}>
            <TextInput
              value={c.name}
              onChangeText={(t) => setExtra((x) => x.map((r, j) => (j === i ? { ...r, name: t } : r)))}
              placeholder="e.g. Peak flow"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.customName]}
            />
            <TextInput
              value={c.value}
              onChangeText={(t) => setExtra((x) => x.map((r, j) => (j === i ? { ...r, value: t } : r)))}
              placeholder="Value"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.customValue]}
            />
            {extra.length > 1 ? (
              <TouchableOpacity onPress={() => setExtra((x) => x.filter((_, j) => j !== i))} hitSlop={8}>
                <Ionicons name="close-circle" size={19} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addAnother}
          onPress={() => setExtra((x) => [...x, { name: '', value: '' }])}
        >
          <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.addAnotherText}>Add another parameter</Text>
        </TouchableOpacity>
      </ScrollView>

      <PrimaryButton
        label={filled ? `Save ${filled} reading${filled === 1 ? '' : 's'}` : 'Save'}
        disabled={!filled}
        style={styles.btn}
        onPress={() => onSave(draft, extra.filter((c) => c.name.trim() && c.value.trim()))}
      />
      <PrimaryButton label="Cancel" variant="outline" style={styles.btnAlt} onPress={onClose} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 380, marginTop: 12 },
  // The paired blood-pressure row is the widest case; everything is sized so
  // it fits a 360dp phone without the second box sliding off the edge.
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rowLabel: { flex: 1, fontSize: 12.5, fontWeight: '600', color: colors.textPrimary },
  inputs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    width: 54, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 8,
    fontSize: 13.5, color: colors.textPrimary, textAlign: 'center',
  },
  slash: { fontSize: 14, color: colors.textMuted },
  unit: { width: 44, fontSize: 10.5, color: colors.textMuted },
  otherLabel: { marginTop: 14, marginBottom: 8 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  customName: { flex: 1.6, width: undefined, textAlign: 'left' },
  customValue: { flex: 1, width: undefined, textAlign: 'left' },
  addAnother: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  addAnotherText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  btn: { marginTop: 16 },
  btnAlt: { marginTop: 10 },
});
