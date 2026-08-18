import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, typography } from '../theme/theme';
import type { Doctor } from '../data/mock';

export default function DoctorCard({ doctor, onPress }: { doctor: Doctor; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <Image source={{ uri: doctor.profile_image }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={typography.h3} numberOfLines={1}>{doctor.full_name}</Text>
          <Text style={[typography.bodyMuted, styles.spec]} numberOfLines={1}>
            {doctor.specializations.join(', ')}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={13} color="#f0a500" />
            <Text style={styles.metaText}>{doctor.rating} ({doctor.total_reviews})</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{doctor.experience_years} yrs exp</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.fee}>₹{doctor.consultation_fee}</Text>
            <Text style={styles.available}>{doctor.next_available}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background },
  info: { flex: 1, justifyContent: 'center' },
  spec: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  dot: { color: colors.textMuted, marginHorizontal: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  fee: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  available: { fontSize: 12, color: colors.secondaryDark, fontWeight: '600' },
});
