import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import MenuRow from '../../src/components/MenuRow';
import TabHeader from '../../src/components/TabHeader';
import Card from '../../src/components/Card';
import SectionHeader from '../../src/components/SectionHeader';
import { healthRecords } from '../../src/data/mock';
import { colors, typography } from '../../src/theme/theme';

export default function RecordsScreen() {
  const router = useRouter();
  const vitals = healthRecords.filter((r) => r.type === 'vitals');

  return (
    <ScreenWrapper>
      <TabHeader
        title="Records"
        actions={[
          { icon: 'cloud-upload-outline', label: 'Upload document', route: '/more/documents' },
          { icon: 'settings-outline', label: 'Profile settings', route: '/more/profile-settings' },
        ]}
      />

      <SectionHeader title="Latest vitals" />
      <Card style={styles.vitalsCard}>
        {vitals.map((v) => (
          <View key={v.id} style={styles.vitalRow}>
            <Text style={typography.body}>{v.title}</Text>
            <Text style={styles.vitalValue}>{v.value}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Browse" />
      <Card style={{ padding: 4 }}>
        <MenuRow icon="pulse-outline" title="Health Records" subtitle="Vitals, habits, surgeries & more" onPress={() => router.push('/more/health-records')} />
        <MenuRow icon="medical-outline" title="Family Doctor" subtitle="Second opinions" tint={colors.primary} onPress={() => router.push('/more/family-doctor')} />
        <MenuRow icon="medkit-outline" title="Prescriptions" subtitle="Medicines & dosages" tint={colors.secondary} onPress={() => router.push('/more/prescriptions')} />
        <MenuRow icon="folder-outline" title="Documents" subtitle="Lab reports & files" tint={colors.warning} onPress={() => router.push('/more/documents')} />
        <MenuRow icon="wallet-outline" title="Spending" subtitle="Payment history" tint={colors.error} onPress={() => router.push('/more/spending')} />
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  vitalsCard: { gap: 10, marginBottom: 8 },
  vitalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
