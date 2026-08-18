import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={36} color={colors.textMuted} />
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      {subtitle ? <Text style={[typography.bodyMuted, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  title: { marginTop: 10, textAlign: 'center' },
  subtitle: { marginTop: 4, textAlign: 'center' },
});
