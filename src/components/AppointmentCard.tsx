import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { colors, typography } from '../theme/theme';
import type { Appointment } from '../data/mock';

const statusTone: Record<Appointment['status'], 'primary' | 'success' | 'error'> = {
  pending: 'primary',
  upcoming: 'primary',
  rejected: 'error',
  in_progress: 'success',
  completed: 'success',
  cancelled: 'error',
};

const typeIcon: Record<Appointment['appointment_type'], keyof typeof Ionicons.glyphMap> = {
  video: 'videocam-outline',
  in_person: 'business-outline',
  phone: 'call-outline',
};

export default function AppointmentCard({ appt, onPress }: { appt: Appointment; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={typography.h3}>{appt.doctor_name}</Text>
          <Badge label={appt.status} tone={statusTone[appt.status]} />
        </View>
        <Text style={[typography.bodyMuted, styles.spec]}>{appt.specialization}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{appt.appointment_date} · {appt.start_time}</Text>
          <Ionicons name={typeIcon[appt.appointment_type]} size={14} color={colors.textSecondary} style={styles.icon} />
          <Text style={styles.metaText}>{appt.appointment_type.replace('_', ' ')}</Text>
        </View>
        <Text style={styles.complaint} numberOfLines={1}>{appt.chief_complaint}</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  spec: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  icon: { marginLeft: 8 },
  complaint: { marginTop: 8, fontSize: 12.5, color: colors.textPrimary },
});
