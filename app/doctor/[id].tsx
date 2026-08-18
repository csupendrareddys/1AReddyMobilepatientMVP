import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import PrimaryButton from '../../src/components/PrimaryButton';
import { doctors } from '../../src/data/mock';
import { colors, typography } from '../../src/theme/theme';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const doctor = doctors.find((d) => d.id === id) ?? doctors[0];

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Doctor profile" />

      <View style={styles.hero}>
        <Image source={{ uri: doctor.profile_image }} style={styles.avatar} />
        <Text style={typography.h1}>{doctor.full_name}</Text>
        <Text style={typography.bodyMuted}>{doctor.highest_qualification}</Text>
        <View style={styles.badgeRow}>
          {doctor.specializations.map((s) => (
            <Badge key={s} label={s} tone="primary" />
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat icon="star" value={String(doctor.rating)} label={`${doctor.total_reviews} reviews`} />
        <Stat icon="briefcase-outline" value={`${doctor.experience_years}y`} label="Experience" />
        <Stat icon="cash-outline" value={`₹${doctor.consultation_fee}`} label="Consultation" />
      </View>

      <Card style={styles.section}>
        <Text style={typography.h3}>About</Text>
        <Text style={[typography.body, styles.about]}>{doctor.bio}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={typography.h3}>Languages</Text>
        <Text style={[typography.body, styles.about]}>{doctor.languages_known.join(', ')}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={typography.h3}>Hospital affiliations</Text>
        <Text style={[typography.body, styles.about]}>{doctor.hospital_affiliations.join(', ')}</Text>
      </Card>

      <PrimaryButton
        label={`Book appointment · Next: ${doctor.next_available}`}
        style={styles.bookBtn}
        onPress={() => router.push(`/booking/${doctor.id}`)}
      />
    </ScreenWrapper>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted },
  section: { marginBottom: 12 },
  about: { marginTop: 6 },
  bookBtn: { marginTop: 8 },
});
