import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import PrimaryButton from '../../src/components/PrimaryButton';
import { accountStatus, currentPatient } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const checklist = [
  { label: 'Email verified', done: true },
  { label: 'Mobile verified', done: true },
  { label: 'Health profile completed', done: false },
  { label: 'Government ID under review', done: false },
];

export default function AccountStatusScreen() {
  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Account status" />

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={typography.h3}>{currentPatient.full_name}</Text>
          <Badge label={accountStatus.state} tone="success" />
        </View>
        <View style={styles.pillRow}>
          {accountStatus.flags.map((f) => (
            <View key={f} style={styles.pill}>
              <Text style={styles.pillText}>{f}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={[typography.label, styles.sectionLabel]}>VERIFICATION CHECKLIST</Text>
      <Card style={{ gap: 14 }}>
        {checklist.map((c) => (
          <View key={c.label} style={styles.checkRow}>
            <Ionicons
              name={c.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={c.done ? colors.success : colors.textMuted}
            />
            <Text style={[typography.body, !c.done && styles.pendingText]}>{c.label}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton label="Complete health profile" style={styles.cta} variant="outline" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, marginBottom: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.warningDark, backgroundColor: colors.warningLight,
  },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.warningDark },
  sectionLabel: { marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingText: { color: colors.textSecondary },
  cta: { marginTop: 20 },
});
