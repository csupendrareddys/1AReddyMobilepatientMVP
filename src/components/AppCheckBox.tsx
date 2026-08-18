import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../theme/theme';

/**
 * Glyph-swap checkbox — no checkbox library needed, matching the reference
 * app's `AppCheckBox` pattern.
 */
export default function AppCheckBox({
  checked, onToggle, label,
}: { checked: boolean; onToggle: () => void; label?: React.ReactNode }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <MaterialCommunityIcons
        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={24}
        color={checked ? colors.primary : colors.textMuted}
      />
      {typeof label === 'string' ? <Text style={[typography.body, styles.label]}>{label}</Text> : label}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1 },
});
