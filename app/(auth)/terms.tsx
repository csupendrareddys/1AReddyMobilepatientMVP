import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../src/components/ScreenHeader';
import { colors, typography } from '../../src/theme/theme';

const sections = [
  {
    heading: '1. Using this service',
    body: 'Larazen Health connects you with licensed practitioners for remote consultations. It is not a substitute for emergency care. If you believe you are having a medical emergency, call your local emergency number immediately.',
  },
  {
    heading: '2. Your account',
    body: 'You are responsible for keeping your login credentials confidential and for all activity under your account. Accounts are personal — family members should each be added under the Family section rather than sharing a login.',
  },
  {
    heading: '3. Health information',
    body: 'Records, prescriptions and documents you upload are stored to support your care. They are shared with practitioners you consult and with anyone you explicitly grant access to, and are not sold to third parties.',
  },
  {
    heading: '4. Payments and refunds',
    body: 'Consultation fees are shown before you confirm a booking. Cancellations made more than 2 hours before the scheduled start are refunded to your wallet in full.',
  },
  {
    heading: '5. Changes to these terms',
    body: 'We may update these terms as the service evolves. Material changes will be notified in-app before they take effect.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Terms & Conditions" fallback="/(auth)/signup" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[typography.bodyMuted, styles.updated]}>Last updated 2 May 2026</Text>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={typography.h3}>{s.heading}</Text>
            <Text style={[typography.body, styles.paragraph]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  updated: { marginBottom: 20 },
  section: { marginBottom: 20 },
  paragraph: { marginTop: 6, lineHeight: 21 },
});
