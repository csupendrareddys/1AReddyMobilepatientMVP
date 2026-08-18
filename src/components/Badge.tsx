import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/theme';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: '#E8F1FC', fg: colors.primaryDark },
  secondary: { bg: '#E3F5F3', fg: colors.secondaryDark },
  success: { bg: '#E8F5E9', fg: '#2e7d32' },
  warning: { bg: colors.warningLight, fg: colors.warningDark },
  error: { bg: '#FDECEA', fg: '#c62828' },
  neutral: { bg: '#EEF1F4', fg: colors.textSecondary },
};

export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 11, fontWeight: '700' },
});
