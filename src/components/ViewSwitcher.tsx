import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/theme';

/**
 * The four-way view control used by every shelf and list in the app.
 *
 * It lives in one place so the control is identical wherever it appears — a
 * toggle that looks the same but behaves differently from screen to screen is
 * worse than having no toggle at all.
 */

export type ViewMode4 = 'slide' | 'list' | 'grid' | 'table';

export const MODES4: { key: ViewMode4; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'slide', icon: 'albums-outline', label: 'Sliding view' },
  { key: 'list', icon: 'reorder-four-outline', label: 'List view' },
  { key: 'grid', icon: 'grid-outline', label: 'Grid view' },
  { key: 'table', icon: 'list-outline', label: 'Table view' },
];

type Props = {
  /** Drop the control's bottom margin when it sits inline with a heading. */
  inline?: boolean;
  mode: ViewMode4;
  onChange: (m: ViewMode4) => void;
  /** Right-hand hint: the auto-advance interval, or an "n of m" count. */
  hint?: string;
  /** Drop 'slide' where a page shows everything and never auto-advances. */
  modes?: ViewMode4[];
};

export default function ViewSwitcher({ mode, onChange, hint, modes, inline }: Props) {
  const shown = modes ? MODES4.filter((m) => modes.includes(m.key)) : MODES4;

  return (
    <View style={[styles.row, inline && styles.rowInline]}>
      <View style={styles.toggle}>
        {shown.map((m) => {
          const active = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => onChange(m.key)}
              style={[styles.btn, active && styles.btnActive]}
              accessibilityLabel={m.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={m.icon} size={14} color={active ? colors.white : colors.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </View>
      {hint ? (
        <View style={styles.hint}>
          {mode === 'slide' ? (
            <Ionicons name="swap-horizontal-outline" size={12} color={colors.textMuted} />
          ) : null}
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rowInline: { marginBottom: 0 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 3, gap: 2,
  },
  btn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.sm - 2 },
  btnActive: { backgroundColor: colors.primary },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  hintText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
});
