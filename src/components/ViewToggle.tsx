import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/theme';

export type ViewMode = 'table' | 'grid';

/** Table ⇄ grid switcher, shared by Prescriptions and Documents. */
export default function ViewToggle({
  mode, onChange,
}: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <View style={styles.wrap}>
      {(['table', 'grid'] as ViewMode[]).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => onChange(m)}
          style={[styles.btn, mode === m && styles.btnActive]}
          accessibilityLabel={m === 'table' ? 'Table view' : 'Grid view'}
        >
          <Ionicons
            name={m === 'table' ? 'list-outline' : 'grid-outline'}
            size={16}
            color={mode === m ? colors.white : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 3, gap: 2,
  },
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm - 2 },
  btnActive: { backgroundColor: colors.primary },
});
