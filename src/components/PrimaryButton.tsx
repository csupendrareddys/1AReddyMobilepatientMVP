import React from 'react';
import {
  ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle,
} from 'react-native';
import { colors, radius } from '../theme/theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'filled' | 'outline' | 'text';
  disabled?: boolean;
  loading?: boolean;
  /** Accepts an array so callers can compose, e.g. [styles.btn, styles.danger]. */
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export default function PrimaryButton({
  label, onPress, variant = 'filled', disabled, loading, style, labelStyle,
}: Props) {
  const isOutline = variant === 'outline';
  const isText = variant === 'text';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        isOutline && styles.outline,
        isText && styles.text,
        !isOutline && !isText && styles.filled,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isText ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.label, isOutline || isText ? styles.labelOutline : styles.labelFilled, labelStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  filled: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  text: { backgroundColor: 'transparent', height: 'auto', paddingVertical: 6 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '700' },
  labelFilled: { color: colors.white },
  labelOutline: { color: colors.primary },
});
