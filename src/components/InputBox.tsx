import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme/theme';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isValid?: boolean;
  containerStyle?: object;
};

export default function InputBox({ label, icon, isValid = true, containerStyle, ...rest }: Props) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, !isValid && styles.rowInvalid]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, backgroundColor: colors.surface,
  },
  rowInvalid: { borderColor: colors.error, borderWidth: 2 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 10 },
});
