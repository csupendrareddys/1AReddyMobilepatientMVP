import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors } from '../theme/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: string;
  onPress?: () => void;
};

export default function StatTile({ icon, label, value, tint = colors.primary, onPress }: Props) {
  const body = (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}1A` }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        {/* Only tappable tiles get a chevron, so the affordance is honest. */}
        {onPress ? <Ionicons name="chevron-forward" size={14} color={colors.textMuted} /> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );

  if (!onPress) return body;
  return (
    <TouchableOpacity style={styles.press} activeOpacity={0.85} onPress={onPress}>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  press: { flex: 1 },
  card: { flex: 1, alignItems: 'flex-start', gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  value: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: 11.5, color: colors.textSecondary },
});
