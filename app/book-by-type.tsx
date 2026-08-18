import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import DoctorCard from '../src/components/DoctorCard';
import EmptyState from '../src/components/EmptyState';
import { doctors, symptoms } from '../src/data/mock';
import { colors, radius, typography } from '../src/theme/theme';

export default function BookByTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const matches = selected
    ? doctors.filter((d) =>
        d.specializations.some((s) => selected.includes('Diabetes') ? s.includes('Diabetes') : s.toLowerCase().includes(selected.split(' ')[0].toLowerCase()))
        || doctors.indexOf(d) < 2)
    : [];

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Book by symptom" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Tell us what's bothering you and we'll match you with the right specialist.
      </Text>

      <View style={styles.grid}>
        {symptoms.map((s) => {
          const active = selected === s;
          return (
            <TouchableOpacity key={s} onPress={() => setSelected(s)} style={[styles.tile, active && styles.tileActive]}>
              <Ionicons name="pulse-outline" size={18} color={active ? colors.white : colors.primary} />
              <Text style={[styles.tileText, active && styles.tileTextActive]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected ? (
        <>
          <Text style={[typography.h2, styles.matchTitle]}>Doctors for "{selected}"</Text>
          {matches.slice(0, 3).map((d) => (
            <DoctorCard key={d.id} doctor={d} onPress={() => router.push(`/doctor/${d.id}`)} />
          ))}
        </>
      ) : (
        <EmptyState icon="flash-outline" title="Choose a symptom" subtitle="Pick one above to see matching doctors." />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  tile: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tileText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  tileTextActive: { color: colors.white },
  matchTitle: { marginBottom: 12 },
});
