import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import MenuRow from '../../src/components/MenuRow';
import { colors, typography } from '../../src/theme/theme';

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="More" />

      {/* The three product categories a patient can buy. */}
      <Text style={[typography.label, styles.groupLabel]}>Book &amp; Buy</Text>
      <Card style={styles.group}>
        <MenuRow icon="calendar-outline" title="Quick Consults" subtitle="Video, clinic, home visit or health camp" onPress={() => router.push('/book-by-type')} />
        <MenuRow icon="thermometer-outline" title="Recovery Plans" subtitle="Malaria, dengue, typhoid and more" tint={colors.secondary} onPress={() => router.push('/more/recovery-plans')} />
        <MenuRow icon="heart-circle-outline" title="Advanced Care" subtitle="Surgical recovery & chronic management" tint={colors.warning} onPress={() => router.push('/more/health-plans')} />
      </Card>

      <Text style={[typography.label, styles.groupLabel]}>Care</Text>
      <Card style={styles.group}>
        <MenuRow icon="medical-outline" title="Family Doctor" subtitle="Second opinions on your prescriptions" onPress={() => router.push('/more/family-doctor')} />
        <MenuRow icon="people-outline" title="Family" subtitle="Linked family members" onPress={() => router.push('/more/family')} />
        <MenuRow icon="headset-outline" title="Support staff" subtitle="Care coordinators & counselors" tint={colors.secondary} onPress={() => router.push('/more/support-staff')} />
        <MenuRow icon="notifications-outline" title="Notifications" subtitle="Alerts and reminders" tint={colors.warning} onPress={() => router.push('/more/notifications')} />
        <MenuRow icon="shield-checkmark-outline" title="Account status" subtitle="Verification progress" tint={colors.error} onPress={() => router.push('/more/account-status')} />
      </Card>

      <Text style={[typography.label, styles.groupLabel]}>Records</Text>
      <Card style={styles.group}>
        <MenuRow icon="pulse-outline" title="Vitals & Diagnoses" onPress={() => router.push('/more/health-records')} />
        <MenuRow icon="medkit-outline" title="Prescriptions" tint={colors.secondary} onPress={() => router.push('/more/prescriptions')} />
        <MenuRow icon="folder-outline" title="Documents" tint={colors.warning} onPress={() => router.push('/more/documents')} />
        <MenuRow icon="wallet-outline" title="Spending" tint={colors.error} onPress={() => router.push('/more/spending')} />
      </Card>

      <Text style={[typography.label, styles.groupLabel]}>Payments</Text>
      <Card style={styles.group}>
        <MenuRow icon="card-outline" title="Wallet" subtitle="Balance, top-up and transactions" onPress={() => router.push('/more/wallet')} />
      </Card>

      <Text style={[typography.label, styles.groupLabel]}>Membership & Shopping</Text>
      <Card style={styles.group}>
        <MenuRow icon="ribbon-outline" title="Membership" subtitle="Your subscription tier" onPress={() => router.push('/more/membership')} />
        <MenuRow icon="storefront-outline" title="Marketplace" subtitle="Devices and wellness products" tint={colors.secondary} onPress={() => router.push('/more/marketplace')} />
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  groupLabel: { marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
  group: { padding: 4, marginBottom: 20 },
});
